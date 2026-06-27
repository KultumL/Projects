# ---- Build stage ----
# JDK 25 image; we build with the project's own Maven wrapper (mvnw).
FROM eclipse-temurin:25-jdk AS build
WORKDIR /app

# Copy the wrapper and pom first to cache dependencies.
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Copy source and build the jar, skipping tests.
COPY src ./src
RUN ./mvnw clean package -DskipTests -B

# ---- Run stage ----
FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT} -jar app.jar"]
