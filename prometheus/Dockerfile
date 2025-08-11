FROM prom/prometheus:v3.5.0-debian

RUN apt-get update && apt-get install -y curl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY prometheus.yml /etc/prometheus/prometheus.yml
