package polaris.kafka.websocket

import com.google.gson.Gson
import org.apache.avro.specific.SpecificRecord
import org.apache.kafka.clients.producer.KafkaProducer
import org.apache.kafka.clients.producer.ProducerRecord
import org.apache.kafka.streams.KeyValue
import org.apache.kafka.streams.kstream.KStream
import org.apache.kafka.streams.kstream.Transformer
import org.apache.kafka.streams.kstream.TransformerSupplier
import org.apache.kafka.streams.processor.Processor
import org.apache.kafka.streams.processor.ProcessorContext
import org.apache.kafka.streams.processor.ProcessorSupplier
import org.apache.kafka.streams.processor.To
import polaris.kafka.PolarisKafka
import polaris.kafka.SafeTopic
import polaris.kafka.actionrouter.ActionValue
import polaris.kafka.actionrouter.ActionKey
import java.nio.ByteBuffer

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

class TrackAndTransformFromAction (private val cast : CAST) : Transformer<ActionKey?, ActionValue?, KeyValue<WebsocketEventKey?, WebsocketEventValue?>> {
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
                        (1..10).forEach { _ ->
                            val websocketEventKey = WebsocketEventKey(replyPath.getId())
                            val websocketEventValue = WebsocketEventValue(replyPath.getId(), "SENT", replyPath.getPrincipal(), replyPath, gson.toJson(value))

                            context!!.forward(websocketEventKey, websocketEventValue, To.child("blah"))
                        }
                    }
                    CAST.MULTICAST -> {

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
            TrackAndTransformFromAction(cast)
        })
        .filter { key, value -> key != null && value != null }
        .map { key, value -> KeyValue(key!!, value!!) }
        .foreach { key, value ->
            // Randomly get one of the partitions on the replyPath
            //
            val partition = value.getReplyPath().getPartitions().shuffled()[0]
            val record = ProducerRecord(value.getReplyPath().getTopic(), partition, key, value)
            websocketProducer.send(record) { _, exception ->
                if (exception != null) {
                    println(exception.toString())
                } else {
                    println("Produced message - ${record.value()}")
                }
            }
        }
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

