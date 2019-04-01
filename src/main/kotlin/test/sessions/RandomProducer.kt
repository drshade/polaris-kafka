package test.sessions

import org.apache.kafka.clients.producer.KafkaProducer
import org.apache.kafka.clients.producer.ProducerRecord
import polaris.kafka.PolarisKafka
import polaris.kafka.test.sessions.UserActivityKey
import polaris.kafka.test.sessions.UserActivityValue
import java.util.*

fun main(args : Array<String>) {

    with(PolarisKafka("polaris-kafka-activity-producer")) {
        val userActivityTopic = topic<UserActivityKey, UserActivityValue>("user-activity",12,2)

        userActivityTopic.startProducer()

        fun generateActivity (producer : KafkaProducer<UserActivityKey, UserActivityValue>, user : String, activity : String, resource : String, detail : String) {
            val key = UserActivityKey(user)
            val value = UserActivityValue(user, activity, resource, detail)
            val record = ProducerRecord("user-activity", key, value)
            producer.send(record) { _, exception ->
                if (exception != null) {
                    println(exception.toString())
                } else {
                    println("Produced message: ${record.value()}")
                }
            }
        }

        val random = Random()
        val events = listOf("LOGGED_IN", "FAILED_AUTH", "ADDED_TO_CART", "PAYED", "SEARCHED", "UPDATED_PROFILE", "ADDED_FRIEND", "APPLIED_COUPON")
        val users = listOf("tom", "tjaard", "martin", "david", "webstar", "sasha", "jake", "marais", "albert", "rachidi", "warren", "niren", "archie", "bhavesh", "luke")

        while (true) {
            // Randomly create an event
            //
            val user = users.shuffled(random)[0]
            val event = events.shuffled(random)[0]
            generateActivity(userActivityTopic.producer!!, user, event, "", "")

            // Sleep some random
            //
            Thread.sleep(random.nextInt(500).toLong())
        }

    }


}