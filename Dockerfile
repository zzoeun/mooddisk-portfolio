# 베이스 이미지
FROM eclipse-temurin:17-jdk-alpine

# 시간대를 한국 시간으로 설정 및 curl 설치 (health check용)
RUN apk add --no-cache tzdata curl
ENV TZ=Asia/Seoul
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 작업 디렉토리 설정
WORKDIR /app

# 빌드된 JAR 파일을 컨테이너에 복사
COPY build/libs/*.jar app.jar

# AWS 관련 환경 변수 기본값 설정 (컨테이너 실행 시 오버라이드 가능)
# ENV AWS_ACCESS_KEY_ID=default_key_id \
#     AWS_SECRET_ACCESS_KEY=default_secret_key \
#     AWS_S3_BUCKET=default_bucket \
#     AWS_REGION=ap-northeast-2

# Spring Boot 포트 개방
EXPOSE 8080

# JVM 컨테이너 메모리 최적화 옵션 추가
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]