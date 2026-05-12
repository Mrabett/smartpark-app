# ═══════════════════════════════════════════
# STAGE 1 — BUILD (JDK + JAR)
# ═══════════════════════════════════════════
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app
COPY target/*.jar app.jar
RUN java -Djarmode=layertools -jar app.jar extract

# ═══════════════════════════════════════════
# STAGE 2 — PRODUCTION (JRE leger seulement)
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
