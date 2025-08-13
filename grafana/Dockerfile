# grafana/Dockerfile
FROM grafana/grafana:11.1.0

# grafana.ini 복사
COPY grafana.ini /etc/grafana/grafana.ini

# provisioning 디렉터리 전체 복사
COPY provisioning/ /etc/grafana/provisioning/

# 권한 설정 
USER root
RUN chmod -R 755 /etc/grafana/provisioning/
RUN chown -R grafana:grafana /etc/grafana/provisioning/
USER grafana