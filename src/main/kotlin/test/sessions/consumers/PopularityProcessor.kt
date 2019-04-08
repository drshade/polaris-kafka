package test.sessions.consumers

import org.apache.kafka.streams.KeyValue
import org.apache.kafka.streams.kstream.Grouped
import org.apache.kafka.streams.kstream.SessionWindows
import org.apache.kafka.streams.kstream.Suppressed
import polaris.kafka.PolarisKafka
import polaris.kafka.test.activities.ActivityKey
import polaris.kafka.test.activities.ActivityValue
import polaris.kafka.test.activities.PopularityValue
import java.time.Duration

fun main(args: Array<String>) {

    with(PolarisKafka("polaris-kafka-popularity-processor")) {
        val activityTopic = topic<ActivityKey, ActivityValue>("activity", 12, 2)

        val popularityTopic = topic<ActivityKey, PopularityValue>("popularity", 2, 1)

        consumeStream(activityTopic)
                .groupBy({ activityKey, _ ->
                    activityKey
                }, Grouped.with(activityTopic.keySerde, activityTopic.valueSerde))

                .windowedBy(SessionWindows.with(Duration.ofSeconds(30))) // .grace(Duration.ofSeconds(30)))

                .reduce { a, b ->
                    if (a.getCount() > b.getCount())
                        a
                    else
                        b
                }


                // Suppress - we only want closed windows
                //
                // .suppress(Suppressed.untilWindowCloses(Suppressed.BufferConfig.unbounded()))

                // As a stream
                //
                .toStream()

                .map { winActKey, actValue ->
                    KeyValue(winActKey.key(),
                            PopularityValue(
                                winActKey.key().getActivity(),
                                actValue.getCount(),
                                winActKey.window().start()
                            )
                    )
                }

                .through(popularityTopic.topic, popularityTopic.producedWith())

                .foreach { key, value ->
                    println("activity (${value.getCount()}) ${value.getActivity()} most popular since ${value.getSince()}")
                }

        start()
    }

}