package polaris.kafka.websocket

import io.confluent.kafka.streams.serdes.avro.SpecificAvroSerde
import org.apache.kafka.clients.consumer.ConsumerConfig
import org.apache.kafka.clients.producer.ProducerConfig
import org.apache.kafka.common.serialization.Serdes
import org.apache.kafka.common.utils.Bytes
import org.apache.kafka.streams.KeyValue
import org.apache.kafka.streams.StreamsConfig
import org.apache.kafka.streams.kstream.Materialized
import org.apache.kafka.streams.kstream.SessionWindows
import org.apache.kafka.streams.kstream.Suppressed
import org.apache.kafka.streams.state.KeyValueStore
import polaris.kafka.PolarisKafka
import polaris.kafka.SafeTopic
import java.time.Duration

class WebsocketSessionByPrincipalExpiryStreamProcessor (applicationId : String,
                                                        websocketEventsTopicName: String,
                                                        websocketSessionsTopicName : String,
                                                        sessionDuration : Duration) {

    private val polarisKafka = PolarisKafka(applicationId)
    private val websocketEventsTopic : SafeTopic<String, WebsocketEventValue>
    private val websocketSessionsTopic : SafeTopic<String, ReplyPath>

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

            websocketEventsTopic = stringKeyTopic(websocketEventsTopicName, 12, 3)
            websocketSessionsTopic = stringKeyTopic(websocketSessionsTopicName, 12, 3)

            consumeStream(websocketEventsTopic)
                .filter { key, value -> value.getPrincipal() != null }
                .groupBy { key, value -> value.getPrincipal() }
                .windowedBy(
                    SessionWindows
                        .with(sessionDuration)
                        // Providing a grace period of 20% the session duration for grace
                        //
                        .grace(sessionDuration.dividedBy(5))
                )
                .aggregate(
                    { null },
                    { key : String, left : WebsocketEventValue, agg : ReplyPath? ->
                        left.getReplyPath()
                    },
                    { aggKey, aggLeft, aggRight -> aggLeft }
                )
                .suppress(
                    Suppressed
                        .untilWindowCloses(Suppressed.BufferConfig.unbounded())
                )
                .toStream { key, value ->
                    key.key()
                }
                .mapValues { key, value ->
                    // Anything popping through here is really a tombstone because it's beyond the supressed window
                    //
                    println("Websockets-By-Principal Key: $key SESSION EXPIRATION (from ${websocketSessionsTopic.topic})")
                    null
                }
                .to(websocketSessionsTopic.topic)
        }
    }

    fun start() {
        // Start the streams
        //
        polarisKafka.start()
    }

    fun stop() {
        // Stop streams
        //
        polarisKafka.stop()
    }
}