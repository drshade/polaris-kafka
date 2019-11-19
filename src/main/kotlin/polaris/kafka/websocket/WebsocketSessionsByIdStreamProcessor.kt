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

class WebsocketSessionsByIdStreamProcessor (applicationId : String,
                                            websocketEventsTopicName: String,
                                            websocketSessionsByIdTopicName : String) {

    private val polarisKafka = PolarisKafka(applicationId)
    private val websocketEventsTopic : SafeTopic<String, WebsocketEventValue>
    private val websocketSessionsByIdTopic : SafeTopic<String, ReplyPath>

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
            websocketSessionsByIdTopic = stringKeyTopic(websocketSessionsByIdTopicName, 12, 3)

            // Process websocket events and emit latest replyPath
            //
            val latestOrTombstone = { key: String, value: WebsocketEventValue, _: ReplyPath? ->
                if (value.getState() == "CLOSED" || value.getState() == "ERROR") {
                    // Tombstone this websocket
                    //
                    println("Websockets-By-Id Key: $key REMOVED")
                    null
                } else {
                    // Otherwise update the status
                    //
                    println("Websockets-By-Id Key: $key ADDED Value: ${value.getReplyPath()}")
                    value.getReplyPath()
                }
            }

            consumeStream(websocketEventsTopic)
                .filter { _, value ->
                    value.getState() != "SENT"
                }
                .groupByKey()
                .aggregate(
                    { null },
                    latestOrTombstone,
                    Materialized
                        .`as`<String, ReplyPath?, KeyValueStore<Bytes, ByteArray>>("WebsocketSessionsById")
                        .withCachingDisabled()
                )
                .toStream()
                .to(websocketSessionsByIdTopic.topic)
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