package polaris.kafka.websocket

import com.google.gson.Gson
import org.apache.avro.specific.SpecificRecord
import org.apache.kafka.clients.producer.KafkaProducer
import org.apache.kafka.clients.producer.Partitioner
import org.apache.kafka.clients.producer.ProducerRecord
import org.apache.kafka.clients.producer.internals.DefaultPartitioner
import org.apache.kafka.common.Cluster
import org.apache.kafka.common.serialization.Serdes
import org.apache.kafka.common.utils.Bytes
import org.apache.kafka.streams.KeyValue
import org.apache.kafka.streams.errors.InvalidStateStoreException
import org.apache.kafka.streams.kstream.*
import org.apache.kafka.streams.processor.Processor
import org.apache.kafka.streams.processor.ProcessorContext
import org.apache.kafka.streams.processor.ProcessorSupplier
import org.apache.kafka.streams.processor.StreamPartitioner
import org.apache.kafka.streams.processor.To
import org.apache.kafka.streams.state.KeyValueStore
import org.apache.kafka.streams.state.QueryableStoreTypes
import org.apache.kafka.streams.state.WindowStore
import polaris.kafka.PolarisKafka
import polaris.kafka.SafeTopic
import polaris.kafka.actionrouter.ActionValue
import polaris.kafka.actionrouter.ActionKey
import java.nio.ByteBuffer
import java.time.Duration

val gson = Gson()

const val REPLYPATH_HEADER = "polaris-kafka-replyPath"

enum class CAST {
    UNICAST,
    MULTICAST,
    BROADCAST
}

class TrackAndTransformToAction : Transformer<WebsocketEventKey?, WebsocketEventValue?, KeyValue<ActionKey?, ActionValue?>> {
    private var context : ProcessorContext? = null

    override fun init(context : ProcessorContext?) {
        //("TrackAndTransformToAction.init() called")
        this.context = context
    }

    override fun transform(key : WebsocketEventKey?, value : WebsocketEventValue?) : KeyValue<ActionKey?, ActionValue?> {
        //println("TrackAndTransformToAction.transform() called")
        return if (key != null && value != null) {

            val actionKey = ActionKey(
                value.getPrincipal()
            )
            val actionValue =
                gson.fromJson(value.getData(), ActionValue::class.java)

            // Set headers
            //
            if (value.getReplyPath() != null) {
                context?.headers()?.add(REPLYPATH_HEADER, value.getReplyPath().toByteBuffer().array())
            }

            KeyValue(actionKey, actionValue)
        } else {
            KeyValue(null, null)
        }
    }

    override fun close() {
        //println("TrackAndTransformToAction.close() called")
    }
}

class TrackAndTransformFromAction (private val polarisKafka : PolarisKafka, private val cast : CAST) : Transformer<ActionKey?, ActionValue?, KeyValue<WebsocketEventKey?, WebsocketEventValue?>> {
    private var context : ProcessorContext? = null

    override fun init(context : ProcessorContext?) {
        //println("TrackAndTransformFromAction.init() called")
        this.context = context
    }

    override fun transform(key : ActionKey?, value : ActionValue?) : KeyValue<WebsocketEventKey?, WebsocketEventValue?>? {
        //println("TrackAndTransformFromAction.transform() called")
        return if (key != null && value != null) {

            // Grab the replyPath header and re-hydrate
            //
            val replyPathHeader = context?.headers()?.firstOrNull { header -> header.key() == REPLYPATH_HEADER }
            return if (replyPathHeader != null) {
                val replyPath = ReplyPath.fromByteBuffer(ByteBuffer.wrap(replyPathHeader.value()))

                when (cast) {
                    CAST.UNICAST -> {
                        val websocketEventKey = WebsocketEventKey(replyPath.getId())
                        val websocketEventValue = WebsocketEventValue(replyPath.getId(), "SENT", replyPath.getPrincipal(), replyPath, gson.toJson(value))

                        context!!.forward(websocketEventKey, websocketEventValue)
                    }
                    CAST.BROADCAST -> {
                        // Fan out to every connected socket
                        //
                        try {
                            val websocketsConnectedStore = polarisKafka.streams?.store("WebsocketsConnectedGlobal",
                                QueryableStoreTypes.keyValueStore<String, ReplyPath>())
                            println("WebsocketsConnectedGlobal has ${websocketsConnectedStore?.approximateNumEntries()} approx entries")
                            websocketsConnectedStore?.all()?.forEach { websocket ->

                                println("Fanning out to ${websocket.value.getId()} (${websocket.value.getTopic()} ${websocket.value.getPartitions()})")

                                val websocketEventKey = WebsocketEventKey(websocket.value.getId())
                                val websocketEventValue = WebsocketEventValue(websocket.value.getId(), "SENT", websocket.value.getPrincipal(), websocket.value, gson.toJson(value))

                                context!!.forward(websocketEventKey, websocketEventValue)
                            }
                        }
                        catch (e : InvalidStateStoreException) {
                            // State store might not be open (it's OK - just ignore for now in this use-case)
                            //
                            println(e)
                        }
                    }
                    CAST.MULTICAST -> {
                        // Fan out to every connected socket which has the same principal
                        // TBD - this is very inefficient (as bad as broadcasting) should be maybe better
                        //
                        try {
                            val websocketsConnectedStore = polarisKafka.streams?.store("WebsocketsConnectedGlobal",
                                QueryableStoreTypes.keyValueStore<String, ReplyPath>())
                            println("WebsocketsConnectedGlobal has ${websocketsConnectedStore?.approximateNumEntries()} approx entries")
                            websocketsConnectedStore?.all()?.forEach { websocket ->

                                if (websocket.value.getPrincipal() == value.getPrincipal()) {
                                    println("Principal fanning out to ${websocket.value.getId()} (${websocket.value.getTopic()} ${websocket.value.getPartitions()})")

                                    val websocketEventKey = WebsocketEventKey(websocket.value.getId())
                                    val websocketEventValue = WebsocketEventValue(websocket.value.getId(), "SENT", websocket.value.getPrincipal(), websocket.value, gson.toJson(value))

                                    context!!.forward(websocketEventKey, websocketEventValue)
                                }
                            }
                        }
                        catch (e : InvalidStateStoreException) {
                            // State store might not be open (it's OK - just ignore for now in this use-case)
                            //
                            println(e)
                        }
                    }
                }

                null
            }
            else {
                // Can't really route a record with no reply path
                //
                null
            }
        } else {
            null
        }
    }

    override fun close() {
        //println("TrackAndTransformFromAction.close() called")
    }
}

class ActionRouter(private val websocketTopic: SafeTopic<WebsocketEventKey, WebsocketEventValue>) {

    private val websocketStream : KStream<WebsocketEventKey, WebsocketEventValue>
    private val polarisKafka = PolarisKafka("polaris-kafka-action-router")
    private val websocketProducer : KafkaProducer<WebsocketEventKey, WebsocketEventValue>

    // Hold the references to any streams we are consuming
    //
    private val consumedStreams = mutableMapOf<String, KStream<ActionKey, ActionValue>>()

    init {
        websocketStream = polarisKafka.consumeStream(websocketTopic)
        websocketTopic.startProducer()
        websocketProducer = websocketTopic.producer!!

        val websocketEventValueSerde = polarisKafka.serdeFor<WebsocketEventValue>()
        val replyPathSerde = polarisKafka.serdeFor<ReplyPath>()

        // Tracking only connected sockets
        //
        websocketStream
            .filter { key, value ->
                value.getState() != "SENT"
            }
            .map { key, value ->
                KeyValue(key.getId(), value)
            }
            .groupByKey(Grouped.with(Serdes.String(), websocketEventValueSerde))
            .aggregate(
                { null },
                { key : String, value : WebsocketEventValue, accum : ReplyPath? ->
                    //println("WebsocketsConnected Key: $key Value: $value Accum: $accum")
                    if (value.getState() != "CLOSED" && value.getState() != "ERROR") {
                        println("WebsocketsConnected Key: $key ADDED Value: $value")
                        value.getReplyPath()
                    }
                    else {
                        // Remove all references to this websocket id
                        //
                        println("WebsocketsConnected Key: $key REMOVED")
                        null
                    }
                },
                Materialized.`as`<String, ReplyPath?, KeyValueStore<Bytes, ByteArray>>("WebsocketsConnectedLocal")
                    .withCachingDisabled()
                    .withKeySerde(Serdes.String())
                    .withValueSerde(replyPathSerde)
            )
            .toStream()
            .to("websocket-connected-sockets", Produced.with(Serdes.String(), replyPathSerde))

        // Make this local stores global (because we may need to broadcast to all)
        //
        polarisKafka.createTopicIfNotExist("websocket-connected-sockets", 12, 2)
        polarisKafka.streamsBuilder.globalTable<String, ReplyPath>("websocket-connected-sockets",
            Materialized.`as`<String, ReplyPath, KeyValueStore<Bytes, ByteArray>>("WebsocketsConnectedGlobal")
            .withKeySerde(Serdes.String())
            .withValueSerde(replyPathSerde))
    }

    fun start () {
        polarisKafka.start()
    }

    fun toWebsocket (
        matchResource : String,
        matchAction : String,
        from : SafeTopic<ActionKey, ActionValue>,
        cast : CAST = CAST.UNICAST) {

        // This could cause topology issue in the future where an ActionRouter might need to consume from the
        // same stream twice. If that ever happens then we should keep a reference to that topic and just re-use it
        // here instead.
        //
        if (consumedStreams.containsKey(from.topic)) {
            // If we already have it, return it
            //
            consumedStreams[from.topic]!!
        } else {
            // Otherwise construct, add and return it
            //
            consumedStreams[from.topic] = polarisKafka.consumeStream(from)
            consumedStreams[from.topic]!!
        }
        .filter { key, value ->
            value?.getResource() == matchResource && value.getAction() == matchAction
        }
        .transform(TransformerSupplier<ActionKey?, ActionValue?, KeyValue<WebsocketEventKey?, WebsocketEventValue?>>{
            TrackAndTransformFromAction(polarisKafka, cast)
        })
        .filter { key, value -> key != null && value != null }
        .map { key, value -> KeyValue(key!!, value!!) }
        .to(websocketTopic.topic, Produced.with(websocketTopic.keySerde, websocketTopic.valueSerde) { topic, key, value, numPartitions ->
            // Determine the partition from the replyPath
            //
            value.getReplyPath().getPartitions().shuffled()[0]
        })
//        .foreach { key, value ->
//            // Randomly get one of the partitions on the replyPath
//            //
//            val partition = value.getReplyPath().getPartitions().shuffled()[0]
//            val record = ProducerRecord(value.getReplyPath().getTopic(), partition, key, value)
//            websocketProducer.send(record) { _, exception ->
//                if (exception != null) {
//                    println(exception.toString())
//                } else {
//                    println("Produced message - ${record.value()}")
//                }
//            }
//        }
        //.to(websocketTopic.topic, websocketTopic.producedWith())
    }

    fun toTopic (
        matchResource : String,
        matchAction : String,
        topic : SafeTopic<ActionKey, ActionValue>) {

        websocketStream
            .filter { _, value ->
                if (value.getData() == null) {
                    println("Cannot route with empty payload")
                }
                value.getData() != null
            }
            .transform (TransformerSupplier<WebsocketEventKey?, WebsocketEventValue?, KeyValue<ActionKey?, ActionValue?>> {
                TrackAndTransformToAction()
            })
            .filter { _, value ->
                value?.getResource() == matchResource && value.getAction() == matchAction
            }
            .map { key, value ->
                KeyValue(key!!, value!!)
            }
            .to(topic.topic, topic.producedWith())
    }
}

