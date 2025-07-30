# =============================================================================
# Stage 1: 애플리케이션 빌드
# =============================================================================
FROM gradle:8.5-jdk17 AS build  # Gradle과 JDK 17을 포함한 빌드 이미지 사용
WORKDIR /home/gradle/src         # 작업 디렉토리 설정
COPY build.gradle ./             # Gradle 빌드 파일 복사
COPY src ./src                   # 소스 코드 복사
RUN gradle build -x test         # 테스트를 제외하고 애플리케이션 빌드

# =============================================================================
# Stage 2: 최종 실행 환경 구성
# =============================================================================
FROM eclipse-temurin:17-jre-alpine  # 경량 JRE 이미지 사용 (Alpine Linux 기반)
WORKDIR /app                       # 애플리케이션 작업 디렉토리 설정
COPY --from=build /home/gradle/src/build/libs/*.jar app.jar  # 빌드된 JAR 파일 복사
ENTRYPOINT ["java", "-jar", "app.jar"]  # JAR 파일 실행 명령