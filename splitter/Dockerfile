# Multi-stage build for Spring Boot application
FROM maven:3.9.6-amazoncorretto-21 AS build

# Set working directory
WORKDIR /app

# Copy pom.xml and download dependencies (for better caching)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre

# Set working directory
WORKDIR /app

# Copy the built JAR from build stage
COPY --from=build /app/target/splitter-0.0.1-SNAPSHOT.jar app.jar

# Create a non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
