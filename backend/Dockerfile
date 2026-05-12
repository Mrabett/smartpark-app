# ═══════════════════════════════════════════
# STAGE 1 - MAVEN BUILD
# ═══════════════════════════════════════════
FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B -q
COPY src ./src
RUN mvn package -DskipTests -q
RUN java -Djarmode=layertools -jar target/*.jar extract

# ═══════════════════════════════════════════
# STAGE 2 - PRODUCTION
# ═══════════════════════════════════════════
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S smartpark && adduser -S smartpark -G smartpark
COPY --from=builder /app/dependencies/ ./
COPY --from=builder /app/spring-boot-loader/ ./
COPY --from=builder /app/snapshot-dependencies/ ./
COPY --from=builder /app/application/ ./
RUN chown -R smartpark:smartpark /app
USER smartpark
EXPOSE 8082
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
