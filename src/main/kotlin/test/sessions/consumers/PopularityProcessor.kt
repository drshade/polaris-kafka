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

        val activityTopic = topic<ActivityKey, ActivityValue>("activity", 12, 2)

        val popularityTopic = topic<ActivityKey, PopularityValue>("popularity", 12, 1)

        val userActivityStream = consumeStream(userActivityTopic)

        var activityStreams = mutableListOf<KStream<ActivityKey, ActivityValue>>()// mutableListOf<KStream<Windowed<String>, Long>>()
        listOf(60L) // , 5L, 10L)
                .forEach { rangeInSecs ->
                    // var countProcess = 0

                    var activity = userActivityStream
                            .groupBy({ _, v ->
                                // countProcess++
                                v.getActivity()
                            }, Grouped.with(Serdes.String(), userActivityTopic.valueSerde))

                            .windowedBy(TimeWindows.of(Duration.ofSeconds(rangeInSecs)))
                            .count()

                            // Suppress - closed windows only
                            //
                            .suppress(Suppressed.untilTimeLimit(Duration.ofSeconds(rangeInSecs * 2), Suppressed.BufferConfig.maxRecords(100L)))

                            .toStream()

                            .map { winKey, count ->
                                KeyValue(
                                        ActivityKey(winKey.key()),
                                        ActivityValue(winKey.key(), mutableListOf(""), count)
                                )
                            }

                    activityStreams.add(activity)
                }

        var countProcess = 0
        activityStreams
                .reduce { kStreamA, kStreamB -> kStreamA.merge(kStreamB) }

//                .through(activityTopic.topic, activityTopic.producedWith())
//
//                .foreach { key, value ->
//                    // println("range: $rangeInSecs s")
//                    // println("Processed $countProcess - activity ${key.getActivity()} -> ${value.getCount()}")
//                    println("Processed - activity ${key.getActivity()} -> ${value.getCount()}")
//                }

                .groupBy({ _, _ ->
                    countProcess++
                    "ALL_ACTIVITIES" // return static => ungrouped
                }, Grouped.with(Serdes.String(), activityTopic.valueSerde))

                .reduce { a, b ->
                    if (a.getCount() > b.getCount()) a
                    else b
                }

                .toStream()

                .map { k, v ->
                    KeyValue(ActivityKey(k),
                            PopularityValue(
                                    v.getActivity(),
                                    v.getCount(),
                                    0 // (k.window().end() - k.window().start()) / 1000
                            )
                    )
                }

                .through(popularityTopic.topic, popularityTopic.producedWith())

                .foreach { _, v ->

                    if (v == null)
                        println("Processed $countProcess records")
                    else {
                        println("Most popular: (${v.getCount()}) ${v.getActivity()}")
                        println("Processed $countProcess records; ${v.getSince()}s window")
                    }
                }

        start()
    }

}