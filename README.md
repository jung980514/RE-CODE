# S13P11E105 - Recode Project

## 🚀 CI/CD 설정 통일 및 환경 변수 최소화

이 프로젝트는 **단일 CI/CD 파이프라인**과 **통합된 환경 설정**을 통해 배포 프로세스를 간소화했습니다.

### 📋 주요 개선사항

#### 1. **통합된 Docker Compose 설정**
- 기존 4개의 환경별 파일 → **1개의 통합 파일**
- 환경 변수를 통한 동적 설정
- 모든 환경(dev, staging, prod) 지원

#### 2. **환경 변수 최소화**
- 환경별 설정 파일: `env.dev`, `env.staging`, `env.prod`
- 중복 코드 제거
- 설정 변경 시 한 곳에서만 수정

#### 3. **단일 Jenkins 파이프라인**
- 모든 환경에 대한 통합 배포 프로세스
- 환경별 파라미터를 통한 배포 환경 선택
- 자동화된 빌드, 테스트, 배포

### 🛠️ 사용법

#### 로컬 개발 환경 실행
```bash
# 개발 환경
export ENV=dev
export BUILD_NUMBER=latest
docker-compose up -d

# 또는 환경 변수 파일 사용
source env.dev
docker-compose up -d
```

#### 배포 스크립트 사용
```bash
# 개발 환경 배포
./scripts/deploy.sh dev latest

# 스테이징 환경 배포
./scripts/deploy.sh staging 123

# 프로덕션 환경 배포
./scripts/deploy.sh prod 456
```

#### Jenkins 파이프라인
1. Jenkins에서 파이프라인 실행
2. `DEPLOY_ENV` 파라미터로 환경 선택 (dev/staging/prod)
3. 자동으로 해당 환경에 배포

### 📁 파일 구조

```
├── docker-compose.yml          # 통합된 Docker Compose 설정
├── env.dev                     # 개발 환경 변수
├── env.staging                 # 스테이징 환경 변수
├── env.prod                    # 프로덕션 환경 변수
├── jenkins/
│   └── Jenkinsfile            # 통합 CI/CD 파이프라인
└── scripts/
    └── deploy.sh              # 통합 배포 스크립트
```

### 🔧 환경 변수

#### 공통 변수
- `ENV`: 배포 환경 (dev/staging/prod)
- `BUILD_NUMBER`: 빌드 번호
- `DOCKER_REGISTRY`: Docker 레지스트리
- `BACKEND_PORT`: 백엔드 포트
- `NGINX_HTTP_PORT`: Nginx HTTP 포트
- `NGINX_HTTPS_PORT`: Nginx HTTPS 포트
- `SSL_CERT_PATH`: SSL 인증서 경로

#### 환경별 변수
- `NODE_ENV`: Node.js 환경 (development/staging/production)
- `SPRING_PROFILES_ACTIVE`: Spring 프로파일

### 🎯 장점

1. **유지보수성 향상**: 설정 파일 중복 제거
2. **배포 안정성**: 단일 파이프라인으로 일관된 배포
3. **환경 변수 관리**: 중앙화된 설정 관리
4. **확장성**: 새로운 환경 추가 시 환경 변수 파일만 추가
5. **가독성**: 명확한 환경별 설정 분리

### 🔄 배포 프로세스

1. **코드 체크아웃**: Git 저장소에서 코드 가져오기
2. **테스트**: 백엔드/프론트엔드 테스트 실행
3. **이미지 빌드**: Docker 이미지 빌드 및 푸시
4. **보안 스캔**: Trivy를 통한 보안 취약점 검사
5. **배포**: 환경별 배포 실행
6. **헬스 체크**: 서비스 정상 동작 확인

### 🚨 주의사항

- 프로덕션 배포 시 사용자 확인 필요
- SSL 인증서는 프로덕션 환경에서만 실제 인증서 사용
- 환경 변수 파일은 보안에 민감한 정보 포함 시 `.gitignore`에 추가
