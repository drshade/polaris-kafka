package test.sessions.consumers

import org.apache.kafka.common.serialization.Serdes
import org.apache.kafka.streams.KeyValue
import org.apache.kafka.streams.kstream.*
import polaris.kafka.PolarisKafka
import polaris.kafka.test.activities.*
import java.time.Duration

// https://www.youtube.com/watch?v=SgEaHrA1KfI

fun main(args: Array<String>) {

    with(PolarisKafka("polaris-kafka-popularity-processor")) {
        val activityTopic = topic<ActivityKey, ActivityValue>("activity", 12, 2)

        val popularityTopic = topic<ActivityKey, PopularityValue>("popularity", 12, 1)

        var countProcess = 0
        consumeStream(activityTopic)

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