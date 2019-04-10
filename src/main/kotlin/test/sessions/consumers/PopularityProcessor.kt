// https://www.youtube.com/watch?v=SgEaHrA1KfI
package test.sessions.consumers

import org.apache.kafka.common.serialization.Serdes
import org.apache.kafka.streams.KeyValue
import org.apache.kafka.streams.kstream.Grouped
import org.apache.kafka.streams.kstream.Suppressed
import org.apache.kafka.streams.kstream.TimeWindows
import polaris.kafka.PolarisKafka
import polaris.kafka.test.activities.ActivityKey
import polaris.kafka.test.activities.PopularityValue
import polaris.kafka.test.sessions.UserActivityKey
import polaris.kafka.test.sessions.UserActivityValue
import java.time.Duration

fun main(args: Array<String>) {

    with(PolarisKafka("polaris-kafka-activity-processor")) {
        val userActivityTopic = topic<UserActivityKey, UserActivityValue>("user-activity", 12, 2)

        val popularityTopic = topic<ActivityKey, PopularityValue>("popularity", 12, 2)

        var countProcess = 0
        val userActivityKGroupedStream = consumeStream(userActivityTopic)
                .groupBy({ _, v ->
                    countProcess++
                    v.getActivity()
                }, Grouped.with(Serdes.String(), userActivityTopic.valueSerde))

        var countProcessB = 0
        listOf(5L, 60L, 10L)
                .map { rangeInSecs->
                    userActivityKGroupedStream

                            .windowedBy(TimeWindows.of(Duration.ofSeconds(rangeInSecs)))
                            .count()

                            // Suppress - closed windows only
                            //
                            .suppress(Suppressed.untilWindowCloses(Suppressed.BufferConfig.unbounded()))
                            // .suppress(Suppressed.untilTimeLimit(Duration.ofSeconds(rangeInSecs), Suppressed.BufferConfig.maxRecords(1000L)))

                            .toStream()
                }

                .reduce { kStreamA, kStreamB -> kStreamB.merge(kStreamA) }

                .map { k, v ->
                    KeyValue(ActivityKey(k.key()),
                            PopularityValue(
                                    k.key(),
                                    v,
                                    (k.window().end() - k.window().start())
                            )
                    )
                }

                .groupBy({ k, v ->
                    countProcessB++
                    v.getSince()
                }, Grouped.with(Serdes.Long(), popularityTopic.valueSerde))
                .windowedBy(TimeWindows.of(Duration.ofSeconds(60)))
                .reduce { a, b ->
                    if (a.getCount() > b.getCount()) a
                    else b
                }
                // Suppress - closed windows only
                //
                .suppress(Suppressed.untilWindowCloses(Suppressed.BufferConfig.unbounded()))
                // .suppress(Suppressed.untilTimeLimit(Duration.ofSeconds(60), Suppressed.BufferConfig.maxRecords(1000L)))

                .toStream()

                .map { k, v -> KeyValue(ActivityKey(v.getActivity()), v) }

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