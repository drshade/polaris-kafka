package test.sessions.consumers

import org.apache.kafka.streams.kstream.Grouped
import org.apache.kafka.streams.kstream.SessionWindows
import org.apache.kafka.streams.kstream.Suppressed
import polaris.kafka.PolarisKafka
import polaris.kafka.test.activities.ActivityKey
import polaris.kafka.test.activities.ActivityValue
import java.time.Duration

fun main(args: Array<String>) {

    with(PolarisKafka("polaris-kafka-popularity-processor")) {
        val activityTopic = topic<ActivityKey, ActivityValue>("activity", 12, 2)


        consumeStream(activityTopic)
                .groupBy({ activityKey, _ ->
                    activityKey
                }, Grouped.with(activityTopic.keySerde, activityTopic.valueSerde))

                .windowedBy(SessionWindows.with(Duration.ofSeconds(60)).grace(Duration.ofSeconds(30)))

                .reduce { a, b ->
                    if (a.getCount() > b.getCount())
                        a
                    else
                        b
                }


                // Suppress - we only want closed windows
                //
                .suppress(Suppressed.untilWindowCloses(Suppressed.BufferConfig.unbounded()))

                // As a stream
                //
                .toStream()

                .foreach { key, value ->
                    println("activity (${value.getCount()}) ${value.getActivity()} most popular (after ${key.window().end() - key.window().start()})")
                }

        start()
    }

}