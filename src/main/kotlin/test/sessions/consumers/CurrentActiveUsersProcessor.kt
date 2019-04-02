package test.sessions.consumers

import org.apache.kafka.common.utils.Bytes
import org.apache.kafka.streams.kstream.Grouped
import org.apache.kafka.streams.kstream.Materialized
import org.apache.kafka.streams.state.KeyValueStore
import org.apache.kafka.streams.state.QueryableStoreTypes
import polaris.kafka.PolarisKafka
import polaris.kafka.test.sessions.UserActivityKey
import polaris.kafka.test.sessions.UserActivityValue

fun main(args : Array<String>) {

    with(PolarisKafka("polaris-kafka-current-active-users-processor")) {
        val userActivityTopic = topic<UserActivityKey, UserActivityValue>("user-activity",12,2)

        // Whenever we get a LOGGED_IN - we add to the table, and a LOGGED_OUT we remove from the table
        //
        var countProcess = 0
        consumeStream(userActivityTopic)
            .groupBy({ key, _ ->
                countProcess++
                key
            }, Grouped.with(userActivityTopic.keySerde, userActivityTopic.valueSerde))
            .aggregate(
                // Aggregate and return null if the new state is LOGGED_OUT
                // which will remove the entry from the materialized table
                //
                { null },
                { _, value, _ ->
                    if (value.getActivity() == "LOGGED_OUT") {
                        null
                    } else {
                        value
                    }
                }, Materialized.`as`<UserActivityKey, UserActivityValue, KeyValueStore<Bytes, ByteArray>>("CurrentActiveUsers")
                    .withKeySerde(userActivityTopic.keySerde)
                    .withValueSerde(userActivityTopic.valueSerde))
//
//            We could have used .reduce, but the problem is that reduce will only
//            run once we have an existing v1 - so we can return null then, but if
//            we have no entry, it will not reduce, it will simply become our new entry
//            and thats why we have to use .aggregate
//
//            .reduce ({ v1, v2 ->
//                if (v2.getActivity() == "LOGGED_OUT") {
//                    null
//                } else {
//                    v2
//                }
//            })

        start()

        while (true) {
            try {
                val keyValueStore = streams?.store("CurrentActiveUsers", QueryableStoreTypes.keyValueStore<UserActivityKey, UserActivityValue>())
                var users = mutableListOf<String>()
                var count = 0
                keyValueStore?.all()!!.forEach { entry ->
                    count++
                    users.add(entry.key.getUserId())
                }
                println("Processed $countProcess records - $count active users (${users.sorted()})")
            }
            catch (e : Exception) {
                println("Exception: $e")
            }
            Thread.sleep(1000)
        }
    }

}