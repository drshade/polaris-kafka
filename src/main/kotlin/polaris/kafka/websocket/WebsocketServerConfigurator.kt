package polaris.kafka.websocket

import javax.websocket.server.ServerEndpointConfig

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