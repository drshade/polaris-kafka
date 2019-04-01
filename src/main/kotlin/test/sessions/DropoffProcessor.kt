package test.sessions

import org.apache.kafka.streams.KeyValue
import polaris.kafka.PolarisKafka
import polaris.kafka.test.sessions.UserActivityKey
import polaris.kafka.test.sessions.UserSessionValue

fun main(args : Array<String>) {

    with(PolarisKafka("polaris-kafka-dropoff-processor")) {
        val userSessionTopic = topic<UserActivityKey, UserSessionValue>("user-sessions",12,2)

        consumeStream(userSessionTopic)
            .map {key, value ->
                //println("Key: $key Value: $value")
                KeyValue(key, value)
            }
            .filter { _, value ->
                value.getSession().contains("ADDED_TO_CART") && !value.getSession().contains("PAYED")
            }
            .foreach { key, value ->
                println("User ${key.getUserId()} dropped off! (after ${value.getSession()})")
            }

        start()
    }

}