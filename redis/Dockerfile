FROM redis:7.2

COPY redis.conf /usr/local/etc/redis/redis.conf

# exec form 대신 shell form 사용
CMD redis-server /usr/local/etc/redis/redis.conf --requirepass $REDIS_PASSWORD
