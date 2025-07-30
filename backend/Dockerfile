# =============================================================================
# Stage 1: 애플리케이션 빌드
# =============================================================================
FROM gradle:8.5-jdk17 AS build
WORKDIR /home/gradle/src
COPY build.gradle ./
COPY src ./src
RUN gradle build -x test

# =============================================================================
# Stage 2: 최종 실행 환경 구성
# =============================================================================
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /home/gradle/src/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]