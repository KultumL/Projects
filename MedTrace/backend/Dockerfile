# ---- Build stage ----
# Official Maven image with JDK 25 — builds the app into a jar.
FROM maven:3-eclipse-temurin-25 AS build
WORKDIR /app

# Copy pom first and cache dependencies (faster rebuilds when only code changes).
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and build, skipping tests for a faster deploy build.
COPY src ./src
RUN mvn clean package -DskipTests -B

# ---- Run stage ----
# Slim JRE image to run the built jar.
FROM eclipse-temurin:25-jre
WORKDIR /app

# Copy the built jar from the build stage.
COPY --from=build /app/target/*.jar app.jar

# Render provides the port via $PORT; Spring binds to it.
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT} -jar app.jar"]
