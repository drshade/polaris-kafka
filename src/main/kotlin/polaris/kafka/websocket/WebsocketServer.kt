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
    val polarisKafka : PolarisKafka,
    val websocketTopic : SafeTopic<String, WebsocketEventValue>,
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
        val endpointHandler = WebsocketServerEndpointHandler(polarisKafka, websocketTopic, authPlugin)

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
    }

    fun join() {
        println("Waiting on websocket join()...")
        server.join()
    }

    fun stop() {
        server.stop()
        println("Websocket server stopped")
    }

    fun start() {
        println("Starting websocket server, listening on port $port...")
        server.start()
        server.dump(System.out)
    }
}



