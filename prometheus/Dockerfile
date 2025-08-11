FROM prom/prometheus:v3.5.0 as base

FROM debian:stable-slim
RUN apt-get update && apt-get install -y curl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=base /bin/prometheus /bin/prometheus
COPY --from=base /bin/promtool /bin/promtool
COPY --from=base /etc/prometheus /etc/prometheus
COPY --from=base /usr/share/prometheus /usr/share/prometheus

COPY prometheus.yml /etc/prometheus/prometheus.yml

ENTRYPOINT ["/bin/prometheus"]
