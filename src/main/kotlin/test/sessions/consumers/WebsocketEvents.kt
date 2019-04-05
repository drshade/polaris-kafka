package test.sessions.consumers

import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import polaris.kafka.PolarisKafka
import polaris.kafka.actionrouter.ActionKey
import polaris.kafka.actionrouter.ActionValue
import polaris.kafka.websocket.*
import java.awt.event.ActionEvent
import java.security.InvalidParameterException

const val WEBSOCKET_LISTEN_PORT = "websocket_listen_port"

// For this example we just look for a field in the JSON incoming body called "token"
// and use this for authentication
//
data class AuthableJson(
    @SerializedName("token") val token : String
)

val authPlugin = { body : String ->
    val gson = Gson()
    val authableBody = gson.fromJson<AuthableJson>(body, AuthableJson::class.java)

    if (authableBody?.token != null) {
        // For this example just use the token as the principal (testing obviously only!)
        //
        println("Just authenticated ${authableBody.token}")
        authableBody.token
    }
    else {
        // Not authenticated
        //
        null
    }
}

fun main(args : Array<String>) {
    val listenPort = System.getenv(WEBSOCKET_LISTEN_PORT)
        ?: throw InvalidParameterException("Missing environment variable '$WEBSOCKET_LISTEN_PORT'")

    with(PolarisKafka("websocket-server")) {
        val websocketTopic =
                topic<WebsocketEventKey, WebsocketEventValue>("websocket-events", 12, 3)

        val websocketServer = WebsocketServer(
            listenPort.toInt(),
            "/ws",
            websocketTopic,
            authPlugin)

        with(ActionRouter(websocketTopic)) {
            val ping = topic<ActionKey, ActionValue>("pings", 12, 3)
            val pong = topic<ActionKey, ActionValue>("pongs", 12, 3)

            toTopic("TEST", "PING", ping)
            toWebsocket("TEST", "PONG", pong, CAST.UNICAST)

            toTopic("TEST", "BIGPING", ping)
            toWebsocket("TEST", "BIGPONG", pong, CAST.BROADCAST)

            start()
        }

        start()
        websocketServer.join()
    }
}