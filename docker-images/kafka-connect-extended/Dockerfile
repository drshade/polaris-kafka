FROM confluentinc/cp-kafka-connect:5.2.1

# MySQL driver
#
ENV MYSQL_DRIVER_VERSION 5.1.39

RUN curl -k -SL "https://dev.mysql.com/get/Downloads/Connector-J/mysql-connector-java-${MYSQL_DRIVER_VERSION}.tar.gz" \
     | tar -xzf - -C /usr/share/java/kafka/ --strip-components=1 mysql-connector-java-5.1.39/mysql-connector-java-${MYSQL_DRIVER_VERSION}-bin.jar   

# Confluent hub connectors
#
RUN confluent-hub install --no-prompt debezium/debezium-connector-mysql:0.9.4
