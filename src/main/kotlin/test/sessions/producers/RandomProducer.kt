package test.sessions.producers

import org.apache.kafka.clients.producer.KafkaProducer
import org.apache.kafka.clients.producer.ProducerRecord
import polaris.kafka.PolarisKafka
import polaris.kafka.test.sessions.UserActivityKey
import polaris.kafka.test.sessions.UserActivityValue
import java.util.*
import kotlin.math.max
import kotlin.math.min

fun main(args : Array<String>) {

    with(PolarisKafka("polaris-kafka-activity-producers")) {
        val userActivityTopic = topic<UserActivityKey, UserActivityValue>("user-activity",12,2)

        userActivityTopic.startProducer()

        var count = 0
        fun generateActivity (producer : KafkaProducer<UserActivityKey, UserActivityValue>, user : String, activity : String, resource : String, detail : String) {
            val key = UserActivityKey(user)
            val value = UserActivityValue(user, activity, resource, detail)
            val record = ProducerRecord("user-activity", key, value)
            count++
            producer.send(record) { _, exception ->
                if (exception != null) {
                    println(exception.toString())
                } else {
                    println("Produced $count messages - ${record.value()}")
                }
            }
        }

        val random = Random()
        val events = listOf(
            "LOGGED_IN", "FAILED_AUTH", "ADDED_TO_CART", "PAID", "SEARCHED",
            "UPDATED_PROFILE", "ADDED_FRIEND", "APPLIED_COUPON", "LOGGED_OUT"
        )
        val userFirstNames = listOf(
            "tom", "tjaard", "martin", "david", "webstar",
            "sasha", "jake", "marais", "albert", "rachidi",
            "warren", "niren", "archie", "bhavesh", "luke"
        )

        // Generate a set of users
        //
        val delay = 500 // max ms
        val max_users = 10
        val users =
            (0 until max_users)
                .map { "${randomAdjective()}-${userFirstNames.shuffled(random)[0]}" }

        while (true) {
            // Randomly create an event (using normal distribution so it's a bit more real feeling)
            //
            val mean = max_users / 2
            val stddev = max_users / 5
            val pick = max(min((random.nextGaussian() * stddev + mean).toInt(), max_users-1), 0)
            val user = users[pick]
            val event = events.shuffled(random)[0]
            generateActivity(userActivityTopic.producer!!, user, event, "", "")

            // Sleep some random
            //
            Thread.sleep(random.nextInt(delay).toLong())
        }
    }
}