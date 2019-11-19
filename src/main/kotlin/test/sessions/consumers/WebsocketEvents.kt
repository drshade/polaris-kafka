package test.sessions.consumers

import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import polaris.kafka.PolarisWebsocket
import java.security.InvalidParameterException

const val WEBSOCKET_LISTEN_PORT = "websocket_listen_port"

// For this example we just look for a field in the JSON incoming body called "token"
// and use this for authentication
//
data class AuthableJson(
    @SerializedName("token") val token : String
)

val totallyUnsafeAuthPlugin = { body : String ->
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

    val polarisWebsocket = PolarisWebsocket(
        listenPort.toInt(),
        "/ws",
        "example-websocket-events",
        ".polaris.websocket.events",
        totallyUnsafeAuthPlugin)

    with(polarisWebsocket) {


        /*
        with(ActionRouter(websocketTopic)) {
            val ping = topic<ActionKey, ActionValue>("pings", 12, 3)
            val pong = topic<ActionKey, ActionValue>("pongs", 12, 3)

            toTopic("TEST", "PING", ping)
            toWebsocket("TEST", "PONG", pong, CAST.BROADCAST)

            toTopic("TEST", "BIGPING", ping)
            toWebsocket("TEST", "BIGPONG", pong, CAST.BROADCAST)

            printConnected()
            start()
        }
        */

        start()
    }
}