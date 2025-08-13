FROM grafana/grafana:11.1.0

USER root
COPY grafana.ini /etc/grafana/grafana.ini
COPY provisioning/ /etc/grafana/provisioning/

# provisioning은 읽기만 필요
RUN chmod -R 755 /etc/grafana/provisioning/
# UID 472, GID 0(root)로 소유권 설정
RUN chown -R 472:0 /etc/grafana/grafana.ini /etc/grafana/provisioning/

USER 472
