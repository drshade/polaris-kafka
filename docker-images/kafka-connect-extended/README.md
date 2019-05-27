# Kafka connect, extended

A docker images from confluent kafka connect, extending it with various common connectors from confluent hub.

Tag `1.0.0`

- MySQL driver 5.1.39 
- [Debezium CDC connector](https://www.confluent.io/connector/debezium-mysql-cdc-connector/)

# K8s / Helm usage

Add `/usr/share/confluent-hub-components` to `plugin.path` in helm values file when starting the kafka connect container in kubernetes.

```yaml
image: confluentinc/cp-kafka-connect
imageTag: 5.0.1

## Kafka Connect properties
configurationOverrides:
  "plugin.path": "/usr/share/java,/usr/share/confluent-hub-components"
```