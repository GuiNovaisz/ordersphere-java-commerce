FROM maven:3.9.12-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
RUN mvn -B -ntp dependency:go-offline
COPY src ./src
RUN mvn -B -ntp -DskipTests package

FROM eclipse-temurin:24-jre-alpine
RUN addgroup -S ordersphere && adduser -S ordersphere -G ordersphere && apk add --no-cache curl
WORKDIR /app
COPY --from=build --chown=ordersphere:ordersphere /build/target/ordersphere-*.jar app.jar
USER ordersphere
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --start-period=45s --retries=5 CMD curl --fail --silent http://localhost:8080/actuator/health/readiness || exit 1
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=70", "-jar", "/app/app.jar"]
