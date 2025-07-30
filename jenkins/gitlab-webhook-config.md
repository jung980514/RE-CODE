# GitLab Webhook 설정 가이드

## 📋 개요
Jenkins와 GitLab을 연동하여 코드 푸시 시 자동으로 CI/CD 파이프라인이 실행되도록 설정합니다.

## 🔧 Jenkins 설정

### 1. GitLab 플러그인 설치
1. Jenkins 관리 → 플러그인 관리
2. "GitLab" 플러그인 검색 및 설치
3. Jenkins 재시작

### 2. GitLab 연결 설정
1. Jenkins 관리 → 시스템 설정
2. GitLab 섹션에서 다음 설정:
   ```
   Connection name: GitLab
   GitLab host URL: https://lab.ssafy.com
   Credentials: GitLab API token 또는 Username/Password
   ```

### 3. Credentials 설정
1. Jenkins 관리 → Credentials → System → Global credentials
2. "Add Credentials" 클릭
3. Kind: GitLab API token 선택
4. ID: gitlab-token
5. Token: GitLab에서 생성한 Personal Access Token 입력

## 🌐 GitLab 설정

### 1. Personal Access Token 생성
1. GitLab → Settings → Access Tokens
2. Token name: jenkins-webhook
3. Scopes: api, read_user 선택
4. 생성된 토큰을 Jenkins Credentials에 등록

### 2. Webhook 설정
1. 프로젝트 → Settings → Webhooks
2. URL: `http://jenkins-server:8080/project/your-pipeline-name`
3. Secret token: Jenkins에서 설정한 secret token
4. Triggers:
   - Push events
   - Merge request events
   - Tag push events
5. SSL verification: 체크 해제 (내부 네트워크인 경우)
6. "Add webhook" 클릭

### 3. Webhook 테스트
1. 생성된 webhook의 "Test" 버튼 클릭
2. "Push events" 선택하여 테스트
3. Jenkins에서 빌드가 트리거되는지 확인

## 🔒 보안 설정

### 1. Secret Token 설정
Jenkinsfile에서 secret token을 환경 변수로 설정:
```groovy
environment {
    GITLAB_WEBHOOK_SECRET = credentials('gitlab-webhook-secret')
}
```

### 2. IP 화이트리스트 (선택사항)
Jenkins 서버의 IP를 GitLab의 허용 목록에 추가

## 📝 환경 변수

### Jenkins Credentials
- `gitlab-token`: GitLab API 토큰
- `gitlab-webhook-secret`: Webhook secret token

### GitLab Webhook URL 형식
```
http://jenkins-server:8080/project/pipeline-name
http://jenkins-server:8080/gitlab-webhook/post
```

## 🚨 문제 해결

### 1. Webhook이 트리거되지 않는 경우
- URL이 올바른지 확인
- Secret token이 일치하는지 확인
- Jenkins 서버가 GitLab에서 접근 가능한지 확인

### 2. 인증 오류
- Personal Access Token이 올바른지 확인
- Token의 권한이 충분한지 확인

### 3. SSL 인증서 오류
- 내부 네트워크인 경우 SSL verification 체크 해제
- 또는 유효한 SSL 인증서 사용

## 📊 모니터링

### 1. Webhook 로그 확인
- GitLab → Settings → Webhooks → Recent deliveries
- 실패한 요청의 상세 로그 확인

### 2. Jenkins 빌드 로그
- Jenkins → 해당 파이프라인 → Build History
- 빌드 로그에서 GitLab 연동 상태 확인

## 🔄 자동화된 배포 플로우

1. **개발자 코드 푸시** → GitLab
2. **GitLab Webhook 트리거** → Jenkins
3. **Jenkins 파이프라인 실행** → 빌드, 테스트, 배포
4. **배포 완료** → 알림 (선택사항)

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. Jenkins 서버 로그
2. GitLab Webhook 로그
3. 네트워크 연결 상태
4. 인증 정보 유효성 