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
        @Suppress("UNCHECKED_CAST")
        return endpointHandler as T
    }
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

        // How to dispatch different responses
        //
        processor.consumeStream(websocketTopic)
            .filter { _, value -> value.getState() == "SENT" }
            .foreach { _, value ->
                sendToWid(value.getReplyPath().getId(), value.getData())
            }

        processor.start { topicPartitionAssignment ->
            println("Assigned partitions: $topicPartitionAssignment")
            partitions = topicPartitionAssignment[websocketTopic.topic]

            // TODO: It could be that we need to emit a "PARTITIONS_REASSIGNED" event to
            // update each connected websocket's replyPath back to this one
            //
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

        // OPENED event - no principal assigned (because it's just opened and no auth provided)
        //
        val key = WebsocketEventKey(wid)
        val value = WebsocketEventValue(wid, "OPENED", null, getReplyPath(wid, null), null)
        val record = ProducerRecord(websocketTopic.topic, key, value)
        producer.send(record) { _, exception ->
            if (exception != null) {
                println(exception.toString())
            }
        }

        // Send the websocket back his id (for troubleshooting really)
        //
        send(session.id, "{\"resource\": \"CLIENT\", \"action\": \"CONNECTED\", \"data\":{\"id\": \"$wid\"}}")

        println("Opened ${session.id} (wid: $wid)")
    }

    fun getReplyPath(wid : String, principal : String?) : ReplyPath? {
        if (partitions != null) {
            if (!partitions!!.isEmpty()) {
                return ReplyPath(wid, principal, websocketTopic.topic, partitions!!)
            }
        }
        return null
    }

    fun emitEvent(session : Session, state : String, principal : String?, data : String?) {
        val wid = sessionsToWid[session.id]
        if (wid != null) {
            val key = WebsocketEventKey(wid)
            val value = WebsocketEventValue(wid, state, principal, getReplyPath(wid, principal), data)
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
