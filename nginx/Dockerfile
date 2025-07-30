FROM nginx:1.25-alpine  # Nginx Alpine 이미지 사용 (경량 및 보안 강화)
RUN apk add --no-cache curl  # curl 패키지 설치 (헬스 체크용)
RUN mkdir -p /etc/nginx/ssl /var/log/nginx  # SSL 인증서 및 로그 디렉토리 생성

COPY nginx.conf /etc/nginx/nginx.conf  # 커스텀 Nginx 설정 파일 복사
COPY ssl/ /etc/nginx/ssl/  # SSL 인증서 파일 복사
RUN chown -R nginx:nginx /var/cache/nginx /var/log/nginx /etc/nginx/conf.d /etc/nginx/ssl  # nginx 사용자로 소유권 변경

RUN mkdir -p /var/run/nginx && \  # PID 디렉토리 생성
    chown -R nginx:nginx /var/run/nginx && \  # 소유권 변경
    chmod 755 /var/run/nginx  # 권한 설정

USER nginx  # nginx 사용자로 전환 (보안 모범 사례)
EXPOSE 80 443  # HTTP 및 HTTPS 포트 노출

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \  # 헬스 체크 설정
  CMD curl -f http://localhost/health || exit 1  # 헬스 체크 명령

CMD ["nginx", "-g", "daemon off;"]  # Nginx 실행 (포그라운드 모드)