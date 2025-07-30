#!/bin/bash

# =============================================================================
# CI/CD 배포 스크립트 (Jenkins 통합)
# =============================================================================
# 이 스크립트는 Jenkins 파이프라인과 연동되는 배포 자동화 스크립트입니다.
# 사용법: ./scripts/deploy.sh [dev|staging|prod] [BUILD_NUMBER]
# 
# 주요 기능:
# - Jenkins 파이프라인과 연동
# - 환경별 배포 (개발, 스테이징, 프로덕션)
# - Docker 및 docker-compose 상태 확인
# - 서비스 헬스 체크
# - 도메인 접근성 검증
# - 실패 시 롤백 기능
# =============================================================================

set -e  # 오류 발생 시 스크립트 중단

# =============================================================================
# 색상 정의 (터미널 출력용)
# =============================================================================
RED='\033[0;31m'      # 빨간색 (오류)
GREEN='\033[0;32m'    # 초록색 (성공)
YELLOW='\033[1;33m'   # 노란색 (경고/정보)
NC='\033[0m'          # 색상 초기화

# =============================================================================
# 환경 설정
# =============================================================================
ENVIRONMENT=${1:-dev}  # 첫 번째 인자로 환경 설정, 기본값은 dev
BUILD_NUMBER=${2:-latest}  # 두 번째 인자로 빌드 번호 설정, 기본값은 latest

# 환경 유효성 검사
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    echo -e "${RED}Error: Invalid environment. Use dev, staging, or prod${NC}"
    exit 1
fi

echo -e "${GREEN}Starting deployment to ${ENVIRONMENT} environment (Build: ${BUILD_NUMBER})...${NC}"

# =============================================================================
# 환경 변수 로드
# =============================================================================
# Jenkins 환경 변수 설정
export BUILD_NUMBER=${BUILD_NUMBER}

# 환경별 .env 파일이 있으면 로드, 없으면 기본 .env 파일 로드
if [ -f ".env.${ENVIRONMENT}" ]; then
    export $(cat .env.${ENVIRONMENT} | grep -v '^#' | xargs)
elif [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# =============================================================================
# 유틸리티 함수들
# =============================================================================

# Docker 실행 상태 확인 함수
check_docker() {
    echo -e "${YELLOW}Checking Docker status...${NC}"
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}Error: Docker is not running${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Docker is running${NC}"
}

# docker-compose 설치 확인 함수
check_docker_compose() {
    echo -e "${YELLOW}Checking docker-compose availability...${NC}"
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}Error: docker-compose is not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ docker-compose is available${NC}"
}

# 현재 배포 백업 함수 (프로덕션 환경에서만 실행)
backup_deployment() {
    if [ "$ENVIRONMENT" = "prod" ]; then
        echo -e "${YELLOW}Creating backup of current deployment...${NC}"
        # 현재 컨테이너들을 안전하게 중지하고 정리
        docker-compose -f docker-compose.${ENVIRONMENT}.yml down --timeout 30 || true
        docker system prune -f  # 사용하지 않는 Docker 리소스 정리
        echo -e "${GREEN}✓ Backup completed${NC}"
    fi
}

# 서비스 배포 함수
deploy_services() {
    echo -e "${GREEN}Deploying services...${NC}"
    
    # 최신 이미지 풀링
    echo -e "${YELLOW}Pulling latest images...${NC}"
    docker-compose -f docker-compose.${ENVIRONMENT}.yml pull
    
    # 서비스 시작
    echo -e "${YELLOW}Starting services...${NC}"
    docker-compose -f docker-compose.${ENVIRONMENT}.yml up -d
    
    # 서비스가 준비될 때까지 대기
    echo -e "${YELLOW}Waiting for services to be ready...${NC}"
    sleep 30
    
    # 서비스 헬스 체크
    check_health
}

# 서비스 헬스 체크 함수
check_health() {
    echo -e "${GREEN}Checking service health...${NC}"
    
    # 모든 컨테이너가 실행 중인지 확인
    if ! docker-compose -f docker-compose.${ENVIRONMENT}.yml ps | grep -q "Up"; then
        echo -e "${RED}Error: Some services failed to start${NC}"
        docker-compose -f docker-compose.${ENVIRONMENT}.yml logs
        exit 1
    fi
    
    # Nginx 헬스 체크 (최대 5분 대기)
    timeout=300  # 5분
    counter=0
    while [ $counter -lt $timeout ]; do
        if curl -f http://localhost/health > /dev/null 2>&1; then
            echo -e "${GREEN}All services are healthy!${NC}"
            return 0
        fi
        echo -e "${YELLOW}Waiting for services to be healthy... ($counter/$timeout)${NC}"
        sleep 10
        counter=$((counter + 10))
    done
    
    echo -e "${RED}Error: Services failed health check${NC}"
    docker-compose -f docker-compose.${ENVIRONMENT}.yml logs
    exit 1
}

# 도메인 접근성 검증 함수 (프로덕션 환경에서만 실행)
verify_domains() {
    if [ "$ENVIRONMENT" = "prod" ]; then
        echo -e "${GREEN}Verifying domain accessibility...${NC}"
        
        # 두 도메인 모두 확인
        for domain in "recode-my-life.site" "i13e105.p.ssafy.io"; do
            if curl -f https://${domain}/health > /dev/null 2>&1; then
                echo -e "${GREEN}✓ ${domain} is accessible${NC}"
            else
                echo -e "${RED}✗ ${domain} is not accessible${NC}"
                return 1
            fi
        done
    fi
}

# 실패 시 롤백 함수
rollback() {
    echo -e "${RED}Deployment failed. Rolling back...${NC}"
    # 현재 배포를 중지하고 이전 버전으로 복원
    docker-compose -f docker-compose.${ENVIRONMENT}.yml down
    docker-compose -f docker-compose.${ENVIRONMENT}.yml up -d
}

# =============================================================================
# 메인 배포 프로세스
# =============================================================================
main() {
    echo -e "${GREEN}=== Deployment to ${ENVIRONMENT} environment (Build: ${BUILD_NUMBER}) ===${NC}"
    
    # 배포 전 사전 검사
    check_docker
    check_docker_compose
    
    # 현재 배포 백업 (프로덕션 환경에서만)
    backup_deployment
    
    # 서비스 배포
    if deploy_services; then
        # 배포 검증
        if verify_domains; then
            echo -e "${GREEN}=== Deployment completed successfully! ===${NC}"
            
            # 서비스 상태 표시
            echo -e "${GREEN}Service Status:${NC}"
            docker-compose -f docker-compose.${ENVIRONMENT}.yml ps
            
            # 최근 로그 요약 표시
            echo -e "${GREEN}Recent logs:${NC}"
            docker-compose -f docker-compose.${ENVIRONMENT}.yml logs --tail=20
        else
            echo -e "${RED}Domain verification failed${NC}"
            rollback
            exit 1
        fi
    else
        echo -e "${RED}Deployment failed${NC}"
        rollback
        exit 1
    fi
}

# =============================================================================
# 스크립트 중단 처리
# =============================================================================
# Ctrl+C나 다른 중단 신호 발생 시 롤백 실행
trap 'echo -e "${RED}Deployment interrupted${NC}"; rollback; exit 1' INT TERM

# 메인 함수 실행
main "$@" 