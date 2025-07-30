# GitHub Webhook 설정 가이드

## 개요
이 문서는 Jenkins와 GitHub 간의 webhook 설정을 위한 가이드입니다.

## 1. Jenkins 플러그인 설치

### 필수 플러그인
- **GitHub Integration Plugin**
- **GitHub API Plugin**
- **GitHub Branch Source Plugin**

### 설치 방법
1. Jenkins 관리 → 플러그인 관리
2. "Available" 탭에서 위 플러그인들 검색 및 설치
3. Jenkins 재시작

## 2. Jenkins 시스템 설정

### GitHub 설정
1. Jenkins 관리 → 시스템 설정
2. **GitHub** 섹션 찾기
3. 설정:
   - **GitHub API URL**: `https://api.github.com`
   - **Credentials**: GitHub Personal Access Token 추가
   - **Test connection** 클릭하여 연결 확인

### GitHub Personal Access Token 생성
1. GitHub → Settings → Developer settings → Personal access tokens
2. **Generate new token** 클릭
3. 권한 설정:
   - `repo` (전체 저장소 접근)
   - `admin:repo_hook` (webhook 관리)
4. 토큰 생성 후 안전한 곳에 보관

## 3. GitHub 저장소 Webhook 설정

### Webhook 추가
1. GitHub 저장소 → Settings → Webhooks
2. **Add webhook** 클릭
3. 설정:
   - **Payload URL**: `http://your-jenkins-url/github-webhook/`
   - **Content type**: `application/json`
   - **Secret**: (선택사항) 보안을 위한 시크릿 키
   - **Events**: `Just the push event` 또는 `Send me everything`
   - **Active**: 체크

### Webhook URL 예시
- 로컬 개발: `http://localhost:8080/github-webhook/`
- 원격 서버: `http://your-server-ip:8080/github-webhook/`

## 4. Jenkins Job 설정

### Pipeline 설정
```groovy
pipeline {
    agent { label 'new-node' }
    
    // GitHub webhook 트리거
    triggers {
        githubPush()
    }
    
    // 또는 SCM 폴링 (webhook이 작동하지 않을 때 대안)
    // triggers {
    //     pollSCM('H/5 * * * *')  // 5분마다 폴링
    // }
    
    // ... 나머지 파이프라인 설정
}
```

### Freestyle Job 설정
1. Job 설정 → **Build Triggers**
2. **GitHub hook trigger for GITScm polling** 체크
3. **Poll SCM** 체크 (선택사항)
4. **Schedule**: `H/5 * * * *` (5분마다 폴링)

## 5. 테스트 및 확인

### Webhook 테스트
1. GitHub 저장소에서 파일 수정
2. Commit & Push
3. Jenkins에서 자동 빌드 시작 확인

### 로그 확인
1. Jenkins → Job → Build → Console Output
2. GitHub webhook 관련 로그 확인

## 6. 문제 해결

### 일반적인 문제들

#### Webhook이 트리거되지 않음
- Jenkins URL이 올바른지 확인
- GitHub Personal Access Token 권한 확인
- Jenkins 플러그인이 설치되었는지 확인

#### 403 Forbidden 오류
- GitHub Personal Access Token 권한 부족
- Jenkins URL이 공개적으로 접근 가능한지 확인

#### 404 Not Found 오류
- Jenkins URL 경로가 올바른지 확인
- `/github-webhook/` 경로가 정확한지 확인

### 디버깅 방법
1. **Jenkins 로그 확인**:
   - Jenkins 관리 → 시스템 로그
   - GitHub webhook 관련 로그 검색

2. **GitHub Webhook 이벤트 확인**:
   - GitHub 저장소 → Settings → Webhooks
   - Recent Deliveries에서 이벤트 상태 확인

3. **Jenkins Job 로그 확인**:
   - Job → Build History → Console Output

## 7. 보안 고려사항

### HTTPS 사용 권장
- 프로덕션 환경에서는 HTTPS 사용
- SSL 인증서 설정 필요

### Webhook Secret 설정
- GitHub webhook에 Secret 설정
- Jenkins에서도 동일한 Secret 설정

### IP 화이트리스트
- Jenkins 서버 IP를 GitHub에서 허용 목록에 추가

## 8. 고급 설정

### 특정 브랜치만 트리거
```groovy
triggers {
    githubPush()
}

// 특정 브랜치에서만 빌드
when {
    branch 'main'  // 또는 'master'
}
```

### 특정 파일 변경 시에만 트리거
```groovy
triggers {
    githubPush()
}

// 특정 파일이 변경되었을 때만 빌드
when {
    changeset "**/*.java"  // Java 파일 변경 시에만
}
```

## 참고 자료
- [Jenkins GitHub Integration Plugin](https://plugins.jenkins.io/github/)
- [GitHub Webhooks Documentation](https://docs.github.com/en/developers/webhooks-and-events/webhooks)
- [Jenkins Pipeline Syntax](https://www.jenkins.io/doc/book/pipeline/syntax/) 