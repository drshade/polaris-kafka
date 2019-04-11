package polaris.kafka.websocket

import de.huxhorn.sulky.ulid.ULID
import io.confluent.kafka.streams.serdes.avro.SpecificAvroSerde
import org.apache.kafka.clients.producer.KafkaProducer
import org.apache.kafka.clients.producer.ProducerRecord
import org.apache.kafka.common.serialization.Serdes
import org.apache.kafka.common.utils.Bytes
import org.apache.kafka.streams.KeyValue
import org.apache.kafka.streams.kstream.Grouped
import org.apache.kafka.streams.kstream.Joined
import org.apache.kafka.streams.kstream.KStream
import org.apache.kafka.streams.kstream.Materialized
import org.apache.kafka.streams.state.KeyValueStore
import org.apache.kafka.streams.state.WindowStore
import org.eclipse.jetty.server.Server
import org.eclipse.jetty.server.ServerConnector
import org.eclipse.jetty.servlet.ServletContextHandler
import org.eclipse.jetty.websocket.jsr356.server.ServerContainer
import org.eclipse.jetty.websocket.jsr356.server.deploy.WebSocketServerContainerInitializer
import polaris.kafka.PolarisKafka
import polaris.kafka.SafeTopic
import java.io.IOException
import java.util.*
import javax.websocket.*
import javax.websocket.server.ServerEndpoint
import javax.websocket.server.ServerEndpointConfig

class WebsocketServer(
    val port: Int,
    val path : String,
    val websocketTopic : SafeTopic<WebsocketEventKey, WebsocketEventValue>,
    val authPlugin : ((body : String) -> (String?))? = null) {

    val server : Server
    val connector : ServerConnector
    val context : ServletContextHandler
    val wscontainer : ServerContainer

    init {
        server = Server()
        connector = ServerConnector(server)
        connector.port = port
        server.addConnector(connector)
        context = ServletContextHandler(ServletContextHandler.SESSIONS)
        context.contextPath = "/"
        server.handler = context

        // This is the meat of the thing - everything happens inside the endpoint handler
        //
        val endpointHandler = WebsocketServerEndpointHandler(websocketTopic, authPlugin)

        val serverEndpointConfig =
            ServerEndpointConfig
                .Builder
                .create(
                    WebsocketServerEndpointHandler::class.java,
                    path)
                .configurator(WebsocketServerConfigurator(endpointHandler))
                .build()

        wscontainer = WebSocketServerContainerInitializer.configureContext(context)
        wscontainer.addEndpoint(serverEndpointConfig)

        server.start()
        server.dump(System.out)
    }

    fun join() {
        println("Starting websocket server, listening on port $port...")
        server.join()
        println("Websocket server stopped")
    }
}

// This is purely here so we can pass stuff into our WebsocketServerEndpointHandler
//
class WebsocketServerConfigurator(
    val endpointHandler : WebsocketServerEndpointHandler)
    : ServerEndpointConfig.Configurator() {
    override fun <T : Any?> getEndpointInstance(endpointClass: Class<T>?): T {
        return endpointHandler as T
    }
}

enum class CAST {
    UNICAST,
    MULTICAST,
    BROADCAST
}

@ServerEndpoint(value = "")
class WebsocketServerEndpointHandler(private val websocketTopic : SafeTopic<WebsocketEventKey, WebsocketEventValue>,
                                     private val authPlugin : ((body : String) -> (String?))? = null) {

    private val sessions = Collections.synchronizedSet(HashSet<Session>())
    private val sessionsToWid = mutableMapOf<String, String>()
    private val widToSessions = mutableMapOf<String, String>()

    private val producer : KafkaProducer<WebsocketEventKey, WebsocketEventValue>

    var partitions : List<Int>? = null

    init {
        // Boot up the kafka producer
        //
        val processor = PolarisKafka("websocket-processor")

        // Start and get the producer for this topic
        //
        websocketTopic.startProducer()
        producer = websocketTopic.producer!!

        // Setup the serdes
        //
        val websocketByPrincipalValueSerde = processor.serdeFor<WebsocketByPrincipalValue>()
        val websocketEventValueSerde = processor.serdeFor<WebsocketEventValue>()

        // Materialize all currently connected websockets (for broadcasting)
        //
        val consumer = processor.consumeStream(websocketTopic)
        consumer
            .map { key, value ->
                KeyValue(key.getId(), value)
            }
            .groupByKey(Grouped.with(Serdes.String(), websocketEventValueSerde))
            .aggregate(
                { null },
                { key, value, accum : String? ->
                    //println("WebsocketsConnected Key: $key Value: $value Accum: $accum")
                    if (value.getState() != "CLOSED" && value.getState() != "ERROR") {
                        "CONNECTED"
                    }
                    else {
                        // Remove all references to this websocket id
                        //
                        null
                    }
                },
                Materialized.`as`<String, String?, KeyValueStore<Bytes, ByteArray>>("WebsocketsConnected")
                    .withKeySerde(Serdes.String())
                    .withValueSerde(Serdes.String())
            )
            .toStream()
            .foreach { key, value ->
                println("WebsocketsConnected $key -> $value")
            }

        // Materialize currently logged in users by principal
        //
        val connectedAuthenticatedWebsockets =
            consumer
                .filter { key, value ->
                    value.getPrincipal() != null
                }
                .map { key, value ->
                    KeyValue(value.getPrincipal(), value)
                }
                .groupByKey(Grouped.with(Serdes.String(), websocketEventValueSerde))
                .aggregate(
                    { WebsocketByPrincipalValue("", mutableListOf()) },
                    { key, value, accum : WebsocketByPrincipalValue ->
                        //println("WebsocketsByPrinciple Key: $key Value: $value Accum: $accum")
                        if (value.getState() != "CLOSED" && value.getState() != "ERROR") {
                            // Add this websocket id if it doesn't already exist
                            //
                            if (!accum.getIds().contains(value.getId())) {
                                WebsocketByPrincipalValue(key, accum.getIds() + value.getId())
                            }
                            // Otherwise do nothing
                            //
                            else {
                                WebsocketByPrincipalValue(key, accum.getIds())
                            }
                        }
                        else {
                            // Remove all references to this websocket id
                            //
                            WebsocketByPrincipalValue(key, accum.getIds().filter { e -> e != value.getId() })
                        }
                    },
                    Materialized.`as`<String, WebsocketByPrincipalValue, KeyValueStore<Bytes, ByteArray>>("WebsocketsByPrinciple")
                        .withKeySerde(Serdes.String())
                        .withValueSerde(websocketByPrincipalValueSerde)
                )
//                .toStream()
//                .foreach { key, value ->
//                    println("WebsocketsByPrinciple $key -> $value")
//                }

        // How to dispatch different responses
        //
        consumer
            .filter { key, value -> value.getState() == CAST.UNICAST.name }
            .foreach { _, value ->
                sendToWid(value.getReplyPath().getId(), value.getData())
            }

        consumer
            .filter { key, value -> value.getState() == CAST.BROADCAST.name }
            .join (
                connectedAuthenticatedWebsockets,
                { v1, v2 ->
                    v2
                },
                Joined.with())

        processor.start { topicPartitionAssignment ->
            println("Assigned partitions: $topicPartitionAssignment")
            partitions = topicPartitionAssignment[websocketTopic.topic]
        }
    }

    @OnOpen
    fun opened(session: Session) {

        val wid = ULID().nextULID().toLowerCase()

        sessions.add(session)
        sessionsToWid[session.id] = wid
        widToSessions[wid] = session.id

        session.maxBinaryMessageBufferSize = 10 * 1024 * 1024
        session.maxTextMessageBufferSize = 10 * 1024 * 1024

        // OPENED event
        //
        val key = WebsocketEventKey(wid)
        val value = WebsocketEventValue(wid, "OPENED", null, getReplyPath(wid), null)
        val record = ProducerRecord(websocketTopic.topic, key, value)
        producer.send(record) { _, exception ->
            if (exception != null) {
                println(exception.toString())
            }
        }
        println("Opened ${session.id} (wid: $wid)")
    }

    fun getReplyPath(wid : String) : ReplyPath? {
        if (partitions != null) {
            if (!partitions!!.isEmpty()) {
                return ReplyPath(wid, websocketTopic.topic, partitions!!)
            }
        }
        return null
    }

    fun emitEvent(session : Session, state : String, principle : String?, data : String?) {
        val wid = sessionsToWid[session.id]
        if (wid != null) {
            val key = WebsocketEventKey(wid)
            val value = WebsocketEventValue(wid, state, principle, getReplyPath(wid), data)
            val record = ProducerRecord(websocketTopic.topic, key, value)
            producer.send(record) { _, exception ->
                if (exception != null) {
                    println(exception.toString())
                }
            }
        }
        else {
            println("Session ${session.id} no longer connected")
        }
    }

    @OnMessage
    fun message(session : Session, data : String) {
        val wid = sessionsToWid[session.id]
        println("Message from $wid -> ${data}")

        // Invoke the auth function if this session is not authenticated
        //
        if (session.userProperties["PRINCIPAL"] == null) {
            val principal = authPlugin?.invoke(data)
            if (principal != null) {
                session.userProperties["PRINCIPAL"] = principal
            }
        }

        // RCVD event
        //
        emitEvent(session, "RCVD", session.userProperties["PRINCIPAL"]?.toString(), data)
    }

    @OnClose
    fun closed(session : Session) {
        sessions.remove(session)
        val wid = sessionsToWid[session.id]

        // CLOSED event
        //
        emitEvent(session, "CLOSED", session.userProperties["PRINCIPAL"]?.toString(), null)

        // Only remove later :)
        //
        sessionsToWid.remove(session.id)
        widToSessions.remove(wid)

        println("Closed $wid")
    }

    @OnError
    fun error(session : Session, throwable : Throwable) {
        sessions.remove(session)
        val wid = sessionsToWid[session.id]

        // ERROR event
        //
        emitEvent(session, "ERROR", session.userProperties["PRINCIPAL"]?.toString(), null)

        // Only remove later :)
        //
        sessionsToWid.remove(session.id)
        widToSessions.remove(wid)

        println("Error $wid -> ${throwable.message}")
    }

    fun sendToWid(wid : String, data : String) {
        val sessionId = widToSessions[wid]
        if (sessionId != null) {
            println("Message to $wid -> $data")
            send(sessionId, data)
        }
        else {
            println("Unable to find session with wid $wid")
        }
    }

    fun send(sessionId : String, data : String) {
        for (session in sessions) {
            if (session.isOpen && session.id.trim().equals(sessionId.trim())) {
                try {
                    session.basicRemote.sendText(data)
                } catch (e: IOException) {
                    e.printStackTrace()
                } catch (e: EncodeException) {
                    e.printStackTrace()
                }
            }
        }
    }

    fun broadcast(data : String) {
        for (session in sessions) {
            if (session.isOpen) {
                try {
                    println("Broadcasting $data")
                    session.basicRemote.sendText(data)
                } catch (e: IOException) {
                    e.printStackTrace()
                } catch (e: EncodeException) {
                    e.printStackTrace()
                }
            }
        }
    }
}
