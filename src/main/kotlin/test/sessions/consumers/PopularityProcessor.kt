// https://www.youtube.com/watch?v=SgEaHrA1KfI
package test.sessions.consumers

import org.apache.kafka.common.serialization.Serdes
import org.apache.kafka.streams.KeyValue
import org.apache.kafka.streams.kstream.Grouped
import org.apache.kafka.streams.kstream.Suppressed.BufferConfig.unbounded
import org.apache.kafka.streams.kstream.Suppressed.untilWindowCloses
import org.apache.kafka.streams.kstream.TimeWindows
import polaris.kafka.PolarisKafka
import polaris.kafka.test.activities.ActivityKey
import polaris.kafka.test.activities.PopularityValue
import polaris.kafka.test.sessions.UserActivityKey
import polaris.kafka.test.sessions.UserActivityValue
import java.time.Duration
import java.time.Instant

fun main(args: Array<String>) {

    with(PolarisKafka("polaris-kafka-activity-processor")) {
        val nowStartSecs = Instant.now().toEpochMilli() / 1000

        val userActivityTopic = topic<UserActivityKey, UserActivityValue>("user-activity", 12, 2)

        val popularityTopic = topic<ActivityKey, PopularityValue>("popularity", 12, 2)

        var countProcess = 0
        val userActivityKGroupedStream = consumeStream(userActivityTopic)
                .groupBy({ _, v ->
                    countProcess++
                    v.getActivity()
                }, Grouped.with(Serdes.String(), userActivityTopic.valueSerde))

        var countProcessB = 0
        listOf(60L, 10L, 5L)
                .map { rangeInSecs ->
                    userActivityKGroupedStream

                            .windowedBy(TimeWindows.of(Duration.ofSeconds(rangeInSecs)).grace(Duration.ofSeconds(1)))
                            .count()

                            // Suppress - closed windows only
                            //
                            .suppress(untilWindowCloses(unbounded()))
                            // .suppress(untilTimeLimit(Duration.ofSeconds(rangeInSecs), maxRecords(1000L)))

                            .toStream()
                }

                .reduce { kStreamA, kStreamB -> kStreamB.merge(kStreamA) }

                .map { k, v ->
                    var activity = k.key() +
                            " w[" +
                            ((k.window().end() - k.window().start()) / 1000).toString() +
                            "s]"
                    KeyValue(ActivityKey(k.key()),
                            PopularityValue(
                                    activity,
                                    v,
                                    k.window().endTime().epochSecond - nowStartSecs
                            )
                    )
                }

                .groupBy({ _, v ->
                    countProcessB++
                    v.getSince()
                }, Grouped.with(Serdes.Long(), popularityTopic.valueSerde))

                .reduce { a, b ->
                    if (a.getCount() > b.getCount()) a
                    else b
                }

                .toStream()

                .map { _, v -> KeyValue(ActivityKey(v.getActivity()), v) }

                .through(popularityTopic.topic, popularityTopic.producedWith())

                .foreach { _, v ->
                    if (v == null)
                        println("Processed $countProcess records; $countProcessB sub-records")
                    else {
                        println("Most popular: ${v.getActivity()} (${v.getCount()})")
                        println("Processed $countProcess records; $countProcessB sub-records; since ${v.getSince()}")
                    }
                }

        start()
    }
}