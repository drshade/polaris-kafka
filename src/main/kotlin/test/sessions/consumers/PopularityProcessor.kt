package test.sessions.consumers

import org.apache.kafka.streams.KeyValue
import polaris.kafka.PolarisKafka
import polaris.kafka.test.activities.ActivityKey
import polaris.kafka.test.activities.ActivityValue
import polaris.kafka.test.sessions.UserActivityKey
import polaris.kafka.test.sessions.UserSessionValue

fun main(args : Array<String>) {

    with(PolarisKafka("polaris-kafka-popularity-processor")) {
        val activityTopic = topic<ActivityKey, ActivityValue>("activity",12,2)

        consumeStream(activityTopic)

//                .filter { _, value ->
//                    countProcess++
//                    value.getSession().contains("ADDED_TO_CART") && !value.getSession().contains("PAYED")
//                }

//                .foreach { key, value ->
//                    println("activity ${key.getUserId()} most popular (after ${value.getSession()})")
//                }

        start()
    }

}