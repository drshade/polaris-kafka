package test.sessions.consumers

import io.confluent.kafka.streams.serdes.avro.SpecificAvroSerde
import org.apache.kafka.streams.KeyValue
import org.apache.kafka.streams.kstream.*
import org.apache.kafka.streams.kstream.Suppressed.BufferConfig.unbounded
import polaris.kafka.PolarisKafka
import polaris.kafka.actionrouter.ActionKey
import polaris.kafka.actionrouter.ActionValue
import polaris.kafka.test.sessions.UserActivityKey
import polaris.kafka.test.sessions.UserActivityList
import polaris.kafka.test.sessions.UserActivityValue
import polaris.kafka.test.sessions.UserSessionValue
import java.time.Duration

fun main(args : Array<String>) {

    with(PolarisKafka("polaris-kafka-ping-processor")) {
        val ping = topic<ActionKey, ActionValue>("pings", 12, 3)
        val pong = topic<ActionKey, ActionValue>("pongs", 12, 3)

        val pingStream = consumeStream(ping)

        pingStream
            .filter { key, value -> value.getAction() == "PING" }
            .mapValues { key, value ->
                ActionValue("TEST", "PONG", null)
            }
            .to(pong.topic, pong.producedWith())

        pingStream
            .filter { key, value -> value.getAction() == "BIGPING" }
            .mapValues { key, value ->
                ActionValue("TEST", "BIGPONG", null)
            }
            .to(pong.topic, pong.producedWith())

        start()
    }

}