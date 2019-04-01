package test.sessions

import io.confluent.kafka.streams.serdes.avro.SpecificAvroSerde
import org.apache.kafka.streams.KeyValue
import org.apache.kafka.streams.kstream.*
import org.apache.kafka.streams.kstream.Suppressed.BufferConfig.unbounded
import polaris.kafka.PolarisKafka
import polaris.kafka.test.sessions.UserActivityKey
import polaris.kafka.test.sessions.UserActivityList
import polaris.kafka.test.sessions.UserActivityValue
import polaris.kafka.test.sessions.UserSessionValue
import java.time.Duration

fun main(args : Array<String>) {

    with(PolarisKafka("polaris-kafka-process-sessions")) {
        val userActivityTopic = topic<UserActivityKey, UserActivityValue>("user-activity",12,2)

        // Interim serde - TODO: Polaris-Kafka should handle these better
        //
        val userActivityListSerde = SpecificAvroSerde<UserActivityList>()
        userActivityListSerde.configure(serdeConfig, false)

        val userSessionTopic = topic<UserActivityKey, UserSessionValue>("user-sessions",12,2)

        consumeStream(userActivityTopic)
            .map {key, value ->
                //println("Key: $key Value: $value")
                KeyValue(key, value)
            }
            .groupBy({ key, _ ->
                key
            }, Grouped.with(userActivityTopic.keySerde, userActivityTopic.valueSerde))
            .windowedBy(SessionWindows.with(Duration.ofSeconds(10)).grace(Duration.ofSeconds(10)))
            .aggregate({
                // Start with empty list
                //
                UserActivityList(listOf())
            }, { _, activity, session ->
                // Append new activity to the list (accumulating)
                //
                UserActivityList(session.getSession() + activity.getActivity())
            }, { _, list1, list2 ->
                // Merge two sessions (if they overlap)
                //
                UserActivityList(list1.getSession() + list2.getSession())
            }, Materialized.with(userSessionTopic.keySerde, userActivityListSerde))
            .suppress(Suppressed.untilWindowCloses(unbounded()))
            .toStream()
            .map { key, value ->
                KeyValue(key.key(),
                    UserSessionValue(
                        key.key().getUserId(),
                        if (value != null) value.getSession() else listOf(),
                        key.window().start(),
                        key.window().end(),
                        key.window().end() - key.window().start())
                )
            }
            .through(userSessionTopic.topic, userSessionTopic.producedWith())
            .foreach { key, value ->
                println("New completed session for ${key.getUserId()} -> ${value}")
            }

        start()
    }

}