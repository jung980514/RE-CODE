#!/bin/bash

# 통합 배포 스크립트
# 사용법: ./deploy.sh [dev|staging|prod] [BUILD_NUMBER]

set -e

# 환경 변수 설정
ENV=${1:-dev}
BUILD_NUMBER=${2:-latest}

echo "🚀 Starting deployment to ${ENV} environment with build ${BUILD_NUMBER}"

# 환경 변수 설정
export ENV=$ENV
export BUILD_NUMBER=$BUILD_NUMBER

# 환경별 환경 변수 설정
if [ "$ENV" = "dev" ]; then
    export NODE_ENV=development
    export SSL_CERT_PATH=./nginx/ssl
    export NGINX_DOMAIN=localhost
elif [ "$ENV" = "staging" ]; then
    export NODE_ENV=staging
    export SSL_CERT_PATH=./nginx/ssl
    export NGINX_DOMAIN=staging.recode-my-life.site
elif [ "$ENV" = "prod" ]; then
    export NODE_ENV=production
    export SSL_CERT_PATH=/etc/letsencrypt
    export NGINX_DOMAIN=recode-my-life.site
else
    echo "❌ Invalid environment: $ENV"
    echo "Available environments: dev, staging, prod"
    exit 1
fi

echo "🔧 Environment: $ENV"
echo "🏗️  Build Number: $BUILD_NUMBER"
echo "🌐 Node Environment: $NODE_ENV"
echo "🔒 SSL Cert Path: $SSL_CERT_PATH"
echo "🌍 Nginx Domain: $NGINX_DOMAIN"

# 기존 컨테이너 중지
echo "🛑 Stopping existing containers..."
docker-compose down --timeout 10 || true

# 포트 충돌 확인 및 해결
echo "🔍 Checking for port conflicts..."
if docker ps --format 'table {{.Names}}\t{{.Ports}}' | grep -q ':8088->' || \
   docker ps --format 'table {{.Names}}\t{{.Ports}}' | grep -q ':80->' || \
   docker ps --format 'table {{.Names}}\t{{.Ports}}' | grep -q ':443->'; then
    echo "⚠️  Port conflicts detected, stopping conflicting containers..."
    docker ps --format '{{.Names}}' | grep -E '(nginx|frontend|backend)' | xargs -r docker stop || true
fi

# 최신 이미지 풀링
echo "📥 Pulling latest images..."
docker-compose pull || echo "⚠️  Pull failed, but continuing..."

# 새 컨테이너 배포
echo "🚀 Starting new containers..."
docker-compose up -d

# 헬스 체크 대기
echo "⏳ Waiting for services to be ready..."
sleep 30

# 서비스 상태 확인
echo "🔍 Checking service status..."
docker-compose ps

# 헬스 체크
echo "🏥 Performing health checks..."
timeout 60 bash -c 'until docker-compose ps | grep -q "Up"; do sleep 5; done' || {
    echo "❌ Services failed to start properly"
    docker-compose logs
    exit 1
}

echo "✅ Deployment to ${ENV} environment completed successfully!"
echo "🌐 Services are now running with build ${BUILD_NUMBER}" 