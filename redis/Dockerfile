FROM redis:7.2.10
COPY redis.conf /usr/local/etc/redis/redis.conf

# 1) 빌드 아규먼트로 선언
ARG REDIS_PASSWORD

# 2) 런타임 ENV 로 설정
ENV REDIS_PASSWORD=${REDIS_PASSWORD}

# 3) 셸 포맷 CMD 로 실행 시점에 확장
CMD sh -c "redis-server /usr/local/etc/redis/redis.conf --requirepass \"$REDIS_PASSWORD\""
