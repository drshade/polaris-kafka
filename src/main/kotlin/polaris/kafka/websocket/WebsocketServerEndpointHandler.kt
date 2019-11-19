package polaris.kafka.websocket

import de.huxhorn.sulky.ulid.ULID
import org.apache.kafka.clients.producer.KafkaProducer
import org.apache.kafka.clients.producer.ProducerRecord
import polaris.kafka.PolarisKafka
import polaris.kafka.SafeTopic
import java.io.IOException
import java.util.*
import javax.websocket.*
import javax.websocket.server.ServerEndpoint

@ServerEndpoint(value = "")
class WebsocketServerEndpointHandler(private val polarisKafka : PolarisKafka,
                                     private val websocketTopic : SafeTopic<String, WebsocketEventValue>,
                                     private val authPlugin : ((body : String) -> (String?))? = null) {

    private val sessions = Collections.synchronizedSet(HashSet<Session>())
    private val sessionsToWid = mutableMapOf<String, String>()
    private val widToSessions = mutableMapOf<String, String>()

    private val producer : KafkaProducer<String, WebsocketEventValue>

    var partitions : List<Int>? = null

    init {
        // Start and get the producer for this topic
        //
        websocketTopic.startProducer()
        producer = websocketTopic.producer!!

        // How to dispatch different responses
        //
        polarisKafka.consumeStream(websocketTopic)
            .filter { _, value -> value.getState() == "SENT" }
            .foreach { _, value ->
                sendToWid(value.getReplyPath().getId(), value.getData())
            }

        polarisKafka.setPartitionsAssignedListener { topicPartitionAssignment ->
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
        val timestamp = Date().time

        sessions.add(session)
        sessionsToWid[session.id] = wid
        widToSessions[wid] = session.id

        session.maxBinaryMessageBufferSize = 10 * 1024 * 1024
        session.maxTextMessageBufferSize = 10 * 1024 * 1024

        // OPENED event - no principal assigned (because it's just opened and no auth provided)
        //
        val key = wid
        val value = WebsocketEventValue(wid, timestamp, "OPENED", null, getReplyPath(wid, timestamp, null), null)
        val record = ProducerRecord(websocketTopic.topic, key, value)
        producer.send(record) { _, exception ->
            if (exception != null) {
                println(exception.toString())
            }
        }

        // Send the websocket back his id (for troubleshooting really)
        //
        send(session.id, "{\"resource\": \"CLIENT\", \"action\": \"CONNECTED\", \"data\":{\"id\": \"$wid\", \"timestamp\": $timestamp}}")

        println("Opened ${session.id} (wid: $wid)")
    }

    fun getReplyPath(wid : String, timestamp : Long, principal : String?) : ReplyPath? {
        if (partitions != null) {
            if (!partitions!!.isEmpty()) {
                return ReplyPath(wid, timestamp, principal, websocketTopic.topic, partitions!!)
            }
        }
        return null
    }

    fun emitEvent(session : Session, state : String, principal : String?, data : String?) {
        val wid = sessionsToWid[session.id]
        val timestamp = Date().time
        if (wid != null) {
            val key = wid
            val value = WebsocketEventValue(wid, timestamp, state, principal, getReplyPath(wid, timestamp, principal), data)
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
