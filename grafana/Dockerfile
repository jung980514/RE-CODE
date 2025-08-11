# grafana/Dockerfile
FROM grafana/grafana:11.1.0

# provisioning 디렉터리 전체 복사
COPY provisioning/ /etc/grafana/provisioning/

# 대시보드 파일들을 /var/lib/grafana/dashboards/에 복사
COPY dashboards/ /var/lib/grafana/dashboards/