package polaris.kafka

import com.google.gson.Gson
import io.confluent.kafka.serializers.AbstractKafkaAvroSerDeConfig
import io.confluent.kafka.streams.serdes.avro.SpecificAvroSerde
import org.apache.avro.specific.SpecificRecord
import org.apache.kafka.clients.admin.AdminClient
import org.apache.kafka.clients.admin.NewTopic
import org.apache.kafka.clients.consumer.ConsumerConfig
import org.apache.kafka.clients.producer.KafkaProducer
import org.apache.kafka.clients.producer.ProducerConfig
import org.apache.kafka.clients.producer.ProducerRecord
import org.apache.kafka.common.config.SaslConfigs
import org.apache.kafka.common.errors.InvalidReplicationFactorException
import org.apache.kafka.common.errors.TopicExistsException
import org.apache.kafka.common.serialization.Serde
import org.apache.kafka.common.serialization.Serdes
import org.apache.kafka.streams.KafkaStreams
import org.apache.kafka.streams.StreamsBuilder
import org.apache.kafka.streams.StreamsConfig
import org.apache.kafka.streams.errors.LogAndContinueExceptionHandler
import org.apache.kafka.streams.errors.LogAndFailExceptionHandler
import org.apache.kafka.streams.kstream.*
import org.apache.kafka.streams.processor.StateStore
import java.security.InvalidParameterException
import java.util.*
import java.util.concurrent.ExecutionException
import java.util.concurrent.TimeUnit

val KAFKA_BOOTSTRAP_SERVERS_ENVVAR = "kafka_bootstrap_servers"
val KAFKA_SCHEMA_REGISTRY_URL_ENVVAR = "schema_registry_url"
val CONFLUENT_CLOUD_KEY_ENVVAR = "confluent_cloud_key"
val CONFLUENT_CLOUD_SECRET_ENVVAR = "confluent_cloud_secret"
val CONFLUENT_CLOUD_SCHEMA_KEY_ENVVAR = "confluent_cloud_schema_key"
val CONFLUENT_CLOUD_SCHEMA_SECRET_ENVVAR = "confluent_cloud_schema_secret"

data class SafeTopic<K, V>(
    val topic : String,
    val keySerde : Serde<K>,
    val valueSerde : Serde<V>,
    val properties : Properties) {

    var producer : KafkaProducer<K, V>? = null

    fun consumedWith() : Consumed<K, V> {
        return Consumed.with(keySerde, valueSerde)
    }

    fun producedWith() : Produced<K, V> {
        return Produced.with(keySerde, valueSerde)
    }

    fun serializedWith() : Serialized<K, V> {
        return Serialized.with(keySerde, valueSerde)
    }

    fun <S : StateStore> materializedWith() : Materialized<K, V, S> {
        return Materialized.with(keySerde, valueSerde)
    }

    // Only call this is you want a kafka producers for this topic
    // - keeping in mind the constraint that you can only have a single
    // producers per topic per process
    //
    fun startProducer() {
        producer = KafkaProducer(properties)
    }
}

class PolarisKafka {
    val properties = Properties()
    val serdeConfig : Map<String, String>
    val adminClient : AdminClient
    val streamsBuilder : StreamsBuilder
    var streams : KafkaStreams? = null

    constructor(applicationId : String) {
        val kafka_bootstrap_servers = System.getenv(KAFKA_BOOTSTRAP_SERVERS_ENVVAR)
        val schema_registry_url = System.getenv(KAFKA_SCHEMA_REGISTRY_URL_ENVVAR)

        if (kafka_bootstrap_servers == null) {
            throw InvalidParameterException("Missing environment variable '$KAFKA_BOOTSTRAP_SERVERS_ENVVAR'")
        }
        if (schema_registry_url == null) {
            throw InvalidParameterException("Missing environment variable '$KAFKA_SCHEMA_REGISTRY_URL_ENVVAR'")
        }

        // Fix checkpoint not found issue (multiple stream processor processes hitting the
        // same /tmp/kafka-streams folder
        //
        // REMOVED because not supported in jvm 1.8
        //
        //val pid = ProcessHandle.current().pid()
        //properties[StreamsConfig.STATE_DIR_CONFIG] = "/tmp/kafka-streams-$pid"

        properties[StreamsConfig.APPLICATION_ID_CONFIG] = applicationId
        properties[StreamsConfig.CLIENT_ID_CONFIG] = "$applicationId-client"
        properties[StreamsConfig.BOOTSTRAP_SERVERS_CONFIG] = kafka_bootstrap_servers
        properties["schema.registry.url"] = schema_registry_url

        properties[StreamsConfig.DEFAULT_DESERIALIZATION_EXCEPTION_HANDLER_CLASS_CONFIG] =
            // LogAndFailExceptionHandler::class.java
            LogAndContinueExceptionHandler::class.java

        properties["key.serializer"] = "io.confluent.kafka.serializers.KafkaAvroSerializer"
        properties["value.serializer"] = "io.confluent.kafka.serializers.KafkaAvroSerializer"

        properties[StreamsConfig.PRODUCER_PREFIX + ProducerConfig.INTERCEPTOR_CLASSES_CONFIG] =
            "io.confluent.monitoring.clients.interceptor.MonitoringProducerInterceptor"

        properties[StreamsConfig.CONSUMER_PREFIX + ConsumerConfig.INTERCEPTOR_CLASSES_CONFIG] =
            "io.confluent.monitoring.clients.interceptor.MonitoringConsumerInterceptor"

        // Set number of streams threads to number of cores - seems reasonable
        //
        properties[StreamsConfig.NUM_STREAM_THREADS_CONFIG] = Runtime.getRuntime().availableProcessors()

        // Enable optimization - lets see what it does?
        //
        properties[StreamsConfig.TOPOLOGY_OPTIMIZATION] = StreamsConfig.OPTIMIZE

        properties[StreamsConfig.PROCESSING_GUARANTEE_CONFIG] = StreamsConfig.AT_LEAST_ONCE
        //properties[StreamsConfig.PROCESSING_GUARANTEE_CONFIG] = StreamsConfig.EXACTLY_ONCE

       // Confluent cloud
       // ---------------------------------------------------------------------------
       //
       if (kafka_bootstrap_servers.contains("confluent.cloud")) {
           val confluent_cloud_key = System.getenv(CONFLUENT_CLOUD_KEY_ENVVAR)
           val confluent_cloud_secret = System.getenv(CONFLUENT_CLOUD_SECRET_ENVVAR)
           val confluent_cloud_schema_key = System.getenv(CONFLUENT_CLOUD_SCHEMA_KEY_ENVVAR)
           val confluent_cloud_schema_secret = System.getenv(CONFLUENT_CLOUD_SCHEMA_SECRET_ENVVAR)

           properties.put(StreamsConfig.REPLICATION_FACTOR_CONFIG, 3)
           properties.put(StreamsConfig.SECURITY_PROTOCOL_CONFIG, "SASL_SSL")
           properties.put(SaslConfigs.SASL_MECHANISM, "PLAIN")
           properties.put(SaslConfigs.SASL_JAAS_CONFIG, "org.apache.kafka.common.security.plain.PlainLoginModule required username=\"$confluent_cloud_key\" password=\"$confluent_cloud_secret\";")

           // Recommended performance/resilience settings
           properties.put(StreamsConfig.producerPrefix(ProducerConfig.RETRIES_CONFIG), 2147483647)
           properties.put("producer.confluent.batch.expiry.ms", 9223372036854775807)
           properties.put(StreamsConfig.producerPrefix(ProducerConfig.REQUEST_TIMEOUT_MS_CONFIG), 300000)
           properties.put(StreamsConfig.producerPrefix(ProducerConfig.MAX_BLOCK_MS_CONFIG), 9223372036854775807)

           properties.put("basic.auth.credentials.source", "USER_INFO")
           properties.put("schema.registry.basic.auth.user.info", "$confluent_cloud_schema_key:$confluent_cloud_schema_secret")
       }
       // ---------------------------------------------------------------------------

        serdeConfig = Collections.singletonMap(AbstractKafkaAvroSerDeConfig.SCHEMA_REGISTRY_URL_CONFIG,
            schema_registry_url)

        this.adminClient = AdminClient.create(properties)

        streamsBuilder = StreamsBuilder()
    }

    inline fun <K : SpecificRecord> serdeFor() : SpecificAvroSerde<K> {
        val valueSerde = SpecificAvroSerde<K>()
        valueSerde.configure(serdeConfig, false)
        return valueSerde
    }

    fun createTopicIfNotExist(name : String, partitions : Int, replicas : Int) {
        val result = adminClient.createTopics(Arrays.asList(
            NewTopic(name, partitions, replicas.toShort())
        ))
        try {
            result.all().get(60, TimeUnit.SECONDS)
        } catch (e: ExecutionException) {
            if (e.cause is TopicExistsException) {
                println(e.message)
            }
            else if (e.cause is InvalidReplicationFactorException) {
                createTopicIfNotExist(name, partitions, 1)
            }
            else {
                throw e
            }
        }
    }

    fun <K : SpecificRecord, V : SpecificRecord>topic(
        name : String,
        partitions : Int,
        replicas : Int,
        createIfNotExist : Boolean = true) : SafeTopic<K, V> {
        // Ensure the topic exists
        //
        if (createIfNotExist) {
            createTopicIfNotExist(name, partitions, replicas)
        }

        // Configure the serdes
        //
        val keySerde = SpecificAvroSerde<K>()
        val valueSerde = SpecificAvroSerde<V>()

        keySerde.configure(serdeConfig, true)
        valueSerde.configure(serdeConfig, false)

        return SafeTopic(name, keySerde, valueSerde, properties)
    }

    fun <K, V>consumeStream(topic : SafeTopic<K, V>) : KStream<K, V> {
        return streamsBuilder.stream(topic.topic, topic.consumedWith())
    }

    fun start(partitionsAssignedToTopic : ((Map<String, List<Int>>) -> Unit)? = null) {
        println("Starting streams...")
        val topology = streamsBuilder.build()
        println(topology.describe())
        streams = KafkaStreams(topology, properties)

        streams?.setStateListener { newState, oldState ->
            println("State changed from $oldState to $newState")
            val partitionAssignment = mutableMapOf<String, MutableList<Int>>()
            try {
                streams?.localThreadsMetadata()?.forEach { metadata ->
                    metadata.activeTasks().forEach { task ->

                        task.topicPartitions().forEach { topicPartition ->
                            println("Task: ${task.taskId()} Topic: ${topicPartition.topic()} Partition: ${topicPartition.partition()}")
                            if (!partitionAssignment.containsKey(topicPartition.topic())) {
                                partitionAssignment[topicPartition.topic()] = mutableListOf()
                            }
                            partitionAssignment[topicPartition.topic()]!!.add(topicPartition.partition())
                        }
                    }
                }

                // Notify the consumer that partitions and topics might have changed
                //
                if (partitionsAssignedToTopic != null) {
                    partitionsAssignedToTopic(partitionAssignment)
                }
            }
            catch (e : IllegalStateException) {
                // Might not be running
                //
                println("Failed while interrogating local threads metadata: ${e.message}")
            }
        }

        streams?.cleanUp()
        streams?.start()

        Runtime.getRuntime().addShutdownHook(Thread {
            println("Runtime closing")
            stop()
        })
    }

    fun stop() {
        println("Stopping streams...")
        streams?.close()
    }
}


