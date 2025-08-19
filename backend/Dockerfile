# =============================================================================
# Stage 1: 애플리케이션 빌드
# =============================================================================
FROM gradle:8.5-jdk17 AS build
WORKDIR /home/gradle/src

# # 패키지 목록 업데이트 및 ffmpeg 설치 (빌드 중에만 필요하다면 여기서만)
# RUN apt-get update \
#  && apt-get install -y ffmpeg \
#  && rm -rf /var/lib/apt/lists/*

COPY build.gradle ./  
COPY src ./src  
RUN gradle build -x test  

# =============================================================================
# Stage 2: 최종 실행 환경 구성
# =============================================================================
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Alpine 환경에 ffmpeg 설치
RUN apk add --no-cache ffmpeg

COPY --from=build /home/gradle/src/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
