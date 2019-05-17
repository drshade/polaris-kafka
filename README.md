# Polaris Kafka

A Maven repository for polaris kafka

## Getting Started

`build.gradle`:
```
repositories {
    maven { url 'http://maven.polaris.dev' }
}
dependencies {
    compile('dev.polaris:polaris-kafka:1.0.1')
}
```

Kotlin example:

```kotlin
with(PolarisKafka("my-stream-processor-app-id")) {
    val myTopic = topic<MyAvroKey, MyAvroValue>("my-topic-name", 12, 2)

    consumeStream(myTopic)
        .peek { key, value -> println("$key -> $value") }

    start()
}
```

Environment variables (Confluent cloud example):
- `kafka_bootstrap_servers=ppp-l9eee.eu-west-1.aws.confluent.cloud:9092`
- `schema_registry_url=https://ppp-l9eee.us-east-2.aws.confluent.cloud`
- `confluent_cloud_key=5AAAAAWUAAAAAM`
- `confluent_cloud_secret=1cUxxkKkOFvYYY9Xx1iZ1Z4XbjeVxxUoIQa1UImmmmDxxXXX3xLjWmXx1xX`
- `confluent_cloud_schema_key=5AAAAAWUAAAAAM`
- `confluent_cloud_schema_secret=1cUxxkKkOFvYYY9Xx1iZ1Z4XbjeVxxUoIQa1UImmmmDxxXXX3xLjWmXx1xX`

---

Publish new version of maven repo

```sh
$ AWS_PROFILE=rd gradle publish
```