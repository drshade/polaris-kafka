package test.sessions.consumers

import polaris.kafka.PolarisKafka
import polaris.kafka.websocket.WebsocketEventKey
import polaris.kafka.websocket.WebsocketEventValue
import polaris.kafka.websocket.WebsocketServer
import java.security.InvalidParameterException

const val WEBSOCKET_LISTEN_PORT = "websocket_listen_port"

fun main(args : Array<String>) {
    val listenPort = System.getenv(WEBSOCKET_LISTEN_PORT)
        ?: throw InvalidParameterException("Missing environment variable '$WEBSOCKET_LISTEN_PORT'")

    with(PolarisKafka("websocket-server")) {
        val websocketEvents = topic<WebsocketEventKey, WebsocketEventValue>("websocket-events", 12, 3)

        val server = WebsocketServer(listenPort.toInt(), "/ws", websocketEvents)

        server.join()
    }
}