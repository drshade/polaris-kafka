// https://www.youtube.com/watch?v=SgEaHrA1KfI
package test.sessions.consumers

import org.apache.kafka.common.serialization.Serdes
import org.apache.kafka.streams.KeyValue
import org.apache.kafka.streams.kstream.*
import org.apache.kafka.streams.kstream.Suppressed.*;
import org.apache.kafka.streams.kstream.Suppressed.BufferConfig.maxRecords

import polaris.kafka.PolarisKafka
import polaris.kafka.test.activities.ActivityKey
import polaris.kafka.test.activities.ActivityValue
import polaris.kafka.test.activities.PopularityValue
import polaris.kafka.test.sessions.UserActivityKey
import polaris.kafka.test.sessions.UserActivityValue
import java.time.Duration

fun main(args: Array<String>) {

    with(PolarisKafka("polaris-kafka-activity-processor")) {
        val userActivityTopic = topic<UserActivityKey, UserActivityValue>("user-activity", 12, 2)

        // val activityTopic = topic<ActivityKey, ActivityValue>("activity", 12, 2)

        val popularityTopic = topic<ActivityKey, PopularityValue>("popularity", 4, 1)

        var countProcess = 0
        val userActivityKGroupedStream = consumeStream(userActivityTopic)
                .groupBy({ _, v ->
                    countProcess++
                    v.getActivity()
                }, Grouped.with(Serdes.String(), userActivityTopic.valueSerde))

        var countProcessB = 0
        listOf(60L, 5L, 10L)
                .map { rangeInSecs->
                    userActivityKGroupedStream
                            .windowedBy(TimeWindows.of(Duration.ofSeconds(rangeInSecs)))
                            .count()

                            // Suppress - closed windows only
                            //
                            .suppress(Suppressed.untilTimeLimit(Duration.ofSeconds(rangeInSecs), Suppressed.BufferConfig.maxRecords(1000L)))

                            .toStream()
                }

                .reduce { kStreamA, kStreamB -> kStreamA.merge(kStreamB) }

                .map { k, v ->
                    KeyValue(ActivityKey(k.key()),
                            PopularityValue(
                                    k.key(),
                                    v,
                                    (k.window().end() - k.window().start())
                            )
                    )
                }

                .groupBy({ _, _ ->
                    countProcessB++
                    "ALL_ACTIVITIES" // return static => ungrouped
                }, Grouped.with(Serdes.String(), popularityTopic.valueSerde))

                .reduce { a, b ->
                    if (a.getCount() > b.getCount()) a
                    else b
                }

                .toStream()

                .map { k, v -> KeyValue(ActivityKey(k), v) }

                .through(popularityTopic.topic, popularityTopic.producedWith())

                .foreach { _, v ->
                    if (v == null)
                        println("Processed $countProcess records; $countProcessB subrecords")
                    else {
                        println("Most popular: (${v.getCount()}) ${v.getActivity()}")
                        println("Processed $countProcess records; $countProcessB subrecords; ${v.getSince()}ms window")
                    }
                }

        start()
    }
}