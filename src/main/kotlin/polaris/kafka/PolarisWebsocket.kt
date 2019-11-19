package polaris.kafka

import io.confluent.kafka.streams.serdes.avro.SpecificAvroDeserializer
import io.confluent.kafka.streams.serdes.avro.SpecificAvroSerde
import org.apache.kafka.clients.consumer.ConsumerConfig
import org.apache.kafka.clients.producer.ProducerConfig
import org.apache.kafka.common.serialization.Serdes
import org.apache.kafka.streams.StreamsConfig
import polaris.kafka.websocket.*
import java.time.Duration

class PolarisWebsocket(
    port: Int,
    path: String,
    applicationId : String,
    topicName: String,
    authPlugin : ((body : String) -> (String?))? = null) {

    private val polarisKafka = PolarisKafka(applicationId)
    private val websocketTopic : SafeTopic<String, WebsocketEventValue>
    private val websocketServer : WebsocketServer
    private val websocketSessionsByIdStreamProcessor : WebsocketSessionsByIdStreamProcessor
    private val websocketSessionsByIdExpiryStreamProcessor : WebsocketSessionByIdExpiryStreamProcessor
    //private val websocketSessionsByPrincipalStreamProcessor : WebsocketSessionsByPrincipalStreamProcessor
    //private val websocketSessionsByPrincipalExpiryStreamProcessor : WebsocketSessionByPrincipalExpiryStreamProcessor

    init {
        with(polarisKafka) {
            // Override PolarisKafkas default key serializer (which is the confluent avro one)
            // with a basic string serializer
            //
            properties[ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG] = "org.apache.kafka.common.serialization.StringSerializer"
            properties[ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG] = "org.apache.kafka.common.serialization.StringDeserializer"

            // And set the default serializer to String & WebsocketEventValue
            // as a convenience
            //
            properties[StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG] = Serdes.String().javaClass.name
            properties[StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG] = SpecificAvroSerde::class.java.name

            websocketTopic =
                stringKeyTopic(topicName, 12, 3)

            websocketServer = WebsocketServer(
                port,
                path,
                polarisKafka,
                websocketTopic,
                authPlugin)

            websocketSessionsByIdStreamProcessor = WebsocketSessionsByIdStreamProcessor(
                "$applicationId-sessions-by-id",
                topicName,
                "$topicName-sessions-by-id")

            websocketSessionsByIdExpiryStreamProcessor = WebsocketSessionByIdExpiryStreamProcessor(
                "$applicationId-sessions-by-id-expiry",
                topicName,
                "$topicName-sessions-by-id",
                Duration.ofMinutes(1))

            /*

            Needs to be refactored as principal tracking needs to contains lists of websockets ids, not single replypaths

            websocketSessionsByPrincipalStreamProcessor = WebsocketSessionsByPrincipalStreamProcessor(
                "$applicationId-sessions-by-principal",
                topicName,
                "$topicName-sessions-by-principal")

            websocketSessionsByPrincipalExpiryStreamProcessor = WebsocketSessionByPrincipalExpiryStreamProcessor(
                "$applicationId-sessions-by-principal-expiry",
                topicName,
                "$topicName-sessions-by-principal",
                Duration.ofMinutes(1))
            */
        }
    }

    fun start() {
        // Start the streams
        //
        polarisKafka.start()
        websocketSessionsByIdStreamProcessor.start()
        websocketSessionsByIdExpiryStreamProcessor.start()

        //websocketSessionsByPrincipalStreamProcessor.start()
        //websocketSessionsByPrincipalExpiryStreamProcessor.start()

        // Start the websocket
        //
        websocketServer.start()
    }

    fun stop() {
        // Stop websocket and wait to shutdown
        //
        websocketServer.stop()
        websocketServer.join()

        // Stop streams
        //
        websocketSessionsByIdStreamProcessor.stop()
        websocketSessionsByIdExpiryStreamProcessor.stop()

        //websocketSessionsByPrincipalStreamProcessor.stop()
        //websocketSessionsByPrincipalExpiryStreamProcessor.stop()

        polarisKafka.stop()
    }
}