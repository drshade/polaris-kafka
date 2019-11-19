package test.sessions.consumers

import io.confluent.kafka.streams.serdes.avro.SpecificAvroSerde
import org.apache.kafka.streams.KeyValue
import org.apache.kafka.streams.kstream.*
import org.apache.kafka.streams.kstream.Suppressed.BufferConfig.unbounded
import polaris.kafka.PolarisKafka
import polaris.kafka.test.sessions.UserActivityKey
import polaris.kafka.test.sessions.UserActivityList
import polaris.kafka.test.sessions.UserActivityValue
import polaris.kafka.test.sessions.UserSessionValue
import polaris.kafka.websocket.actionrouter.ActionValue
import java.time.Duration

fun main(args : Array<String>) {

    with(PolarisKafka("polaris-kafka-ping-processor")) {
        val ping = stringKeyTopic<ActionValue>("pings", 12, 3)
        val pong = stringKeyTopic<ActionValue>("pongs", 12, 3)

        val pingStream = consumeStream(ping)

        pingStream
            .filter { _, value -> value.getAction() == "PING" }
            .mapValues { _, value ->
                ActionValue(value.getPrincipal(), "TEST", "PONG", null)
            }
            .to(pong.topic, pong.producedWith())

        pingStream
            .filter { _, value -> value.getAction() == "BIGPING" }
            .mapValues { _, value ->
                ActionValue(value.getPrincipal(), "TEST", "BIGPONG", null)
            }
            .to(pong.topic, pong.producedWith())

        start()
    }

}