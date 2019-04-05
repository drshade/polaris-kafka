package test.sessions.consumers

import io.confluent.kafka.streams.serdes.avro.SpecificAvroSerde
import org.apache.kafka.common.serialization.Serdes
import org.apache.kafka.streams.KeyValue
import org.apache.kafka.streams.kstream.Grouped
import polaris.kafka.PolarisKafka
import polaris.kafka.test.activities.ActivityKey
import polaris.kafka.test.activities.ActivityValue
import polaris.kafka.test.sessions.UserActivityKey
import polaris.kafka.test.sessions.UserActivityList
import polaris.kafka.test.sessions.UserActivityValue

fun main(args: Array<String>) {

    with(PolarisKafka("polaris-kafka-activity-processor")) {
        val userActivityTopic = topic<UserActivityKey, UserActivityValue>("user-activity", 12, 2)

        // Interim serde - TODO: Polaris-Kafka should handle these better
        val userActivityListSerde = SpecificAvroSerde<UserActivityList>()

        userActivityListSerde.configure(serdeConfig, false)

        val activityTopic = topic<ActivityKey, ActivityValue>("activity", 12, 2)

        consumeStream(userActivityTopic)

                .groupBy({ key, v ->
                    v.getActivity()
                }, Grouped.with(Serdes.String(), userActivityTopic.valueSerde))

                .count()

                .toStream()

                .map { activityName, count ->
                    KeyValue(
                            ActivityKey(activityName),
                            ActivityValue(activityName, mutableListOf(""), count)
                    )
                }

                .through(activityTopic.topic, activityTopic.producedWith())

                .foreach { key, value ->
                    println("Processed activity ${key.getActivity()} -> ${value.getCount()}")
                }

        start()
    }

}