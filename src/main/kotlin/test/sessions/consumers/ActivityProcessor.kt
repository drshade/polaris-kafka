package test.sessions.consumers

import org.apache.kafka.common.serialization.Serdes
import org.apache.kafka.streams.KeyValue
import org.apache.kafka.streams.kstream.*
import polaris.kafka.PolarisKafka
import polaris.kafka.test.activities.ActivityKey
import polaris.kafka.test.activities.ActivityValue
import polaris.kafka.test.sessions.UserActivityKey
import polaris.kafka.test.sessions.UserActivityValue
import java.time.Duration

fun main(args: Array<String>) {

    with(PolarisKafka("polaris-kafka-activity-processor")) {
        val userActivityTopic = topic<UserActivityKey, UserActivityValue>("user-activity", 12, 2)

        val activityTopic = topic<ActivityKey, ActivityValue>("activity", 12, 2)

        var countProcess = 0
        listOf(60L) // 5L, 10L,
                .forEach { rangeInSecs ->
                    consumeStream(userActivityTopic)

                            .groupBy({ _, v ->
                                countProcess++
                                v.getActivity()
                            }, Grouped.with(Serdes.String(), userActivityTopic.valueSerde))

                            .windowedBy(TimeWindows.of(Duration.ofSeconds(rangeInSecs)))
                            .count()
                            // Suppress - we only want closed windows
                            //
                            .suppress(Suppressed.untilWindowCloses(Suppressed.BufferConfig.unbounded())) //maxRecords(100)))


                            .toStream()

                            .map { winKey, count ->
                                KeyValue(
                                        ActivityKey(winKey.key()),
                                        ActivityValue(winKey.key(), mutableListOf(""), count)
                                )
                            }

                            .through(activityTopic.topic, activityTopic.producedWith())

                            .foreach { key, value ->
                                println("Processed $countProcess - activity ${key.getActivity()} -> ${value.getCount()}")
                            }

                    start()
                }
    }

}