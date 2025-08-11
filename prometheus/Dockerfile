FROM prom/prometheus:v3.5.0

# curl + CA 인증서 설치
RUN apk add --no-cache curl ca-certificates

COPY prometheus.yml /etc/prometheus/prometheus.yml
