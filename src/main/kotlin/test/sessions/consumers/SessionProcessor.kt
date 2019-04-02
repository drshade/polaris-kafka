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
import java.time.Duration

fun main(args : Array<String>) {

    with(PolarisKafka("polaris-kafka-session-processor")) {
        val userActivityTopic = topic<UserActivityKey, UserActivityValue>("user-activity",12,2)

        // Interim serde - TODO: Polaris-Kafka should handle these better
        //
        val userActivityListSerde = SpecificAvroSerde<UserActivityList>()
        userActivityListSerde.configure(serdeConfig, false)

        val userSessionTopic = topic<UserActivityKey, UserSessionValue>("user-sessions",12,2)
        var countProcess = 0
        consumeStream(userActivityTopic)
            .groupBy({ key, _ ->
                countProcess++
                key
            }, Grouped.with(userActivityTopic.keySerde, userActivityTopic.valueSerde))

            // Session window of 10 seconds inactivity, plus a 5 second grace (for late arrivals)
            //
            .windowedBy(SessionWindows.with(Duration.ofSeconds(10)).grace(Duration.ofSeconds(5)))
            .aggregate({
                // Start with empty list
                //
                UserActivityList(listOf())
            }, { _, activity, session ->
                // Append new activity to the list (accumulating window session)
                //
                UserActivityList(session.getSession() + activity.getActivity())
            }, { _, list1, list2 ->
                // Merge two sessions (if their windows overlap)
                //
                UserActivityList(list1.getSession() + list2.getSession())
            }, Materialized.with(userSessionTopic.keySerde, userActivityListSerde))

            // Suppress - we only want closed windows
            //
            .suppress(Suppressed.untilWindowCloses(unbounded()))

            // As a stream
            //
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
                println("Processed $countProcess records - new completed session for ${key.getUserId()} -> ${value}")
            }

        start()
    }

}