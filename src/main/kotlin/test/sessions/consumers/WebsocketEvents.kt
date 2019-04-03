package test.sessions.consumers

import polaris.kafka.PolarisKafka
import polaris.kafka.actionrouter.ActionKey
import polaris.kafka.actionrouter.ActionValue
import polaris.kafka.websocket.*
import java.awt.event.ActionEvent
import java.security.InvalidParameterException

const val WEBSOCKET_LISTEN_PORT = "websocket_listen_port"

fun main(args : Array<String>) {
    val listenPort = System.getenv(WEBSOCKET_LISTEN_PORT)
        ?: throw InvalidParameterException("Missing environment variable '$WEBSOCKET_LISTEN_PORT'")

    with(PolarisKafka("websocket-server")) {
        val websocketTopic =
                topic<WebsocketEventKey, WebsocketEventValue>("websocket-events", 12, 3)
        val websocketStream = consumeStream(websocketTopic)

        val ping = topic<ActionKey, ActionValue>("pings", 12, 3)
        val pong = topic<ActionKey, ActionValue>("pongs", 12, 3)

        val pongStream = consumeStream(pong)

        val server = WebsocketServer(listenPort.toInt(), "/ws", websocketTopic)

        RouteToTopicFrom(websocketStream, "TEST", "PING", ping)
        RouteFromTopicTo(websocketTopic, "TEST", "PONG", pongStream, CAST.UNICAST)

        RouteToTopicFrom(websocketStream, "TEST", "BIGPING", ping)
        RouteFromTopicTo(websocketTopic, "TEST", "BIGPONG", pongStream, CAST.BROADCAST)


        start()
        server.join()
    }
}