// https://www.youtube.com/watch?v=SgEaHrA1KfI
package test.sessions.consumers

import org.apache.kafka.common.serialization.Serdes
import org.apache.kafka.common.utils.Bytes
import org.apache.kafka.streams.KeyValue
import org.apache.kafka.streams.kstream.Grouped
import org.apache.kafka.streams.kstream.Materialized
import org.apache.kafka.streams.kstream.Suppressed
import org.apache.kafka.streams.kstream.Suppressed.BufferConfig.unbounded
import org.apache.kafka.streams.kstream.Suppressed.untilTimeLimit
import org.apache.kafka.streams.kstream.Suppressed.untilWindowCloses
import org.apache.kafka.streams.kstream.TimeWindows
import org.apache.kafka.streams.state.KeyValueStore
import polaris.kafka.PolarisKafka
import polaris.kafka.test.activities.ActivityKey
import polaris.kafka.test.activities.PopularityKey
import polaris.kafka.test.activities.PopularityValue
import polaris.kafka.test.sessions.UserActivityKey
import polaris.kafka.test.sessions.UserActivityValue
import java.time.Duration
import java.time.Instant

fun main(args: Array<String>) {

    with(PolarisKafka("polaris-kafka-activity-processor")) {
        val userActivityTopic = topic<UserActivityKey, UserActivityValue>("user-activity", 12, 2)
        val popularityTopic = topic<PopularityKey, PopularityValue>("popularity", 12, 2)

        val groupedUserActivities = consumeStream(userActivityTopic)
            .groupBy({ _, v -> v.getActivity() },
                Grouped.with(Serdes.String(), userActivityTopic.valueSerde))

        val popularityStream = listOf(
            6 * 60 * 60,    // 6 hours
            1 * 60 * 60,    // 1 hour
            5 * 60,         // 5 minutes
            60)             // 1 minute
            .map { windowSize ->
                groupedUserActivities
                    .windowedBy (
                        // Use a grace period of half the window size
                        //
                        TimeWindows
                            .of(Duration.ofSeconds(windowSize.toLong()))
                            .grace(Duration.ofMillis((windowSize / 2).toLong()))
                    )
                    .count()

                    // Suppress - closed windows only
                    //
                    .suppress(untilWindowCloses(unbounded()))
                    .toStream()
                    .map { windowedKey, count ->
                        KeyValue(
                            PopularityKey(
                                windowSize,
                                windowedKey.window().start(),
                                windowedKey.window().end()),
                            PopularityValue(
                                windowedKey.key(),
                                count)
                        )
                    }
            }

            .reduce { left, right -> right.merge(left) }
            .through(popularityTopic.topic, popularityTopic.producedWith())

        // From the popularity stream - count the most popular and pump to a table
        //
        popularityStream
            .groupByKey()
            .reduce ({ left, right ->
                if (left.getCount() > right.getCount())
                    left
                else
                    right
            },
                Materialized.`as`<PopularityKey, PopularityValue, KeyValueStore<Bytes, ByteArray>>("MostPopularActivity")
                    .withKeySerde(popularityTopic.keySerde)
                    .withValueSerde(popularityTopic.valueSerde))

        // From the popularity stream - count the least popular and pump to a table
        //
        popularityStream
            .groupByKey()
            .reduce ({ left, right ->
                if (left.getCount() > right.getCount())
                    right
                else
                    left
            },
                Materialized.`as`<PopularityKey, PopularityValue, KeyValueStore<Bytes, ByteArray>>("LeastPopularActivity")
                    .withKeySerde(popularityTopic.keySerde)
                    .withValueSerde(popularityTopic.valueSerde))

        start()
    }
}