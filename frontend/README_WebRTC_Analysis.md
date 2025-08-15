# 🧠 치매 회상치료 플랫폼 - WebRTC 기술 분석

## 📋 프로젝트 개요

이 프로젝트는 **치매 환자를 위한 웹 기반 회상치료 플랫폼**으로, WebRTC 기술을 활용하여 실시간 영상 스트리밍, 음성/비디오 녹화, AI 감정 분석을 통합한 혁신적인 치료 솔루션입니다.

## 🎯 WebRTC 기술 활용 목적

- **실시간 얼굴 표정 분석**: 치료 과정에서 환자의 감정 상태 모니터링
- **음성 응답 녹화**: 개인화된 치료 진행을 위한 데이터 수집
- **브라우저 기반 접근**: 별도 앱 설치 없이 웹에서 직접 이용
- **치료적 상호작용**: 실시간 피드백을 통한 효과적인 치료 경험

## 🔧 핵심 WebRTC API 사용

### 1. getUserMedia API
```typescript
// 웹캠 및 마이크 스트림 획득
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: "user",
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 44100,
  },
})
```

### 2. MediaRecorder API
```typescript
// 비디오/오디오 녹화
const mediaRecorder = new MediaRecorder(streamRef.current, {
  mimeType,
  audioBitsPerSecond: 128000,
  videoBitsPerSecond: 2500000,
})
```

### 3. Web Audio API
```typescript
// 음성 활동 감지
const audioContext = new AudioContext()
const analyser = audioContext.createAnalyser()
analyser.fftSize = 2048
analyser.smoothingTimeConstant = 0.8
```

## 🎬 주요 기능별 WebRTC 활용

### 💻 웹캠 스트리밍 (`WebcamView.tsx`)
- **실시간 영상 스트리밍**: 사용자 얼굴을 실시간으로 화면에 표시
- **음성 활동 감지**: RMS 계산을 통한 발화 상태 실시간 감지
- **브라우저 호환성**: iOS Safari, Chrome 등 다양한 환경 지원
- **시각적 피드백**: 발화 상태에 따른 동적 GIF 이미지 변경

### 🧠 회상 치료 세션들
모든 치료 세션에서 WebRTC 기술 활용:

1. **음성 기억 훈련** (`VoiceMemoryTrainingSession.tsx`)
2. **사진 회상 치료** (`VoicePhotoReminiscenceSession.tsx`)
3. **이야기 치료** (`VoiceStoryTellingSession.tsx`)
4. **음악 치료** (`VoiceMusicTherapySession.tsx`)

각 세션은 다음 기능을 공통으로 제공:
- 실시간 비디오 스트리밍
- 음성/비디오 녹화
- AI 감정 분석
- 브라우저별 최적화된 코덱 선택

### 📊 일상 설문 조사
- **음성 응답 녹음**: 환자의 일상 상태 파악을 위한 음성 데이터 수집
- **스트림 관리**: 미리보기와 녹화 스트림 분리 처리

## 🎥 비디오 녹화 시스템

### 지능적 코덱 선택
```typescript
// 브라우저 지원 여부에 따른 최적 코덱 선택
const mp4Types = [
  'video/mp4; codecs="avc1.424028, mp4a.40.2"', // H.264 + AAC (최고 호환성)
  'video/mp4; codecs="avc1.42E01E, mp4a.40.2"', // H.264 baseline + AAC
  "video/mp4", // 일반 MP4
]

const webmTypes = [
  'video/webm; codecs="vp9, opus"', // VP9 + Opus (고품질)
  'video/webm; codecs="vp8, opus"', // VP8 + Opus (호환성)
  "video/webm", // 일반 WebM
]
```

### 스트림 관리 특징
- **트랙 분리 관리**: 비디오/오디오 트랙 독립적 처리
- **트랙 복제**: 미리보기와 녹화 스트림 분리로 성능 최적화
- **메모리 효율성**: Blob 기반 효율적 데이터 처리
- **에러 복구**: 트랙 없음 상황 대응 로직

## 🤖 AI 감정 분석 통합

### Face-API.js 활용
```typescript
// 실시간 얼굴 표정 인식
const detections = await faceapiRef.current
  .detectSingleFace(videoRef.current, new faceapiRef.current.TinyFaceDetectorOptions())
  .withFaceExpressions()
```

### 감정 분석 특징
- **7가지 감정 인식**: 행복, 슬픔, 놀람, 분노, 공포, 혐오, 중립
- **발화 상태 보정**: 말하기 중 감정 오인식 방지
- **실시간 처리**: 초당 여러 번 감정 상태 업데이트
- **치료 데이터**: 세션별 감정 변화 데이터 수집

### 감정 보정 알고리즘
```typescript
const adjustedExpressions = {
  ...expressions,
  surprised: expressions.surprised * (isSpeaking ? 0.3 : 0.7),
  sad: expressions.sad * (isActuallySad ? 1.0 : 0.1),
  neutral: expressions.neutral * (isNeutralDominant ? 1.4 : 1.2),
  happy: expressions.happy * (isSmiling ? 1.5 : 1.2),
  // ... 기타 감정 보정
}
```

## 🔊 오디오 처리 시스템

### 음성 활동 감지
- **RMS 계산**: 실시간 음성 신호 강도 분석
- **임계값 기반 판단**: 발화/무음 상태 정확한 구분
- **지연 처리**: 3초 무음 유지 시 발화 종료 인식
- **노이즈 필터링**: 에코 제거 및 노이즈 억제

### 오디오 스트림 관리
```typescript
// 음성 분석을 위한 AudioContext 설정
const micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
const audioContext = new AudioContext()
const source = audioContext.createMediaStreamSource(micStream)
const analyser = audioContext.createAnalyser()
source.connect(analyser)
```

## 🛡️ 안정성 및 호환성

### 브라우저 호환성
- **iOS Safari 대응**: autoplay 정책 및 playsInline 속성 처리
- **WebKit 접두사**: webkit 접두사 기반 브라우저 지원
- **모바일 최적화**: 터치 기반 인터페이스 및 반응형 디자인
- **성능 최적화**: 프레임 드롭 방지 및 메모리 관리

### 에러 처리 및 복구
- **미디어 접근 실패**: 권한 거부 시 대체 로직
- **AudioContext 관리**: 중복 생성/종료 방지
- **스트림 정리**: 메모리 누수 방지를 위한 철저한 정리
- **연결 복구**: 네트워크 문제 시 자동 재연결

## 🎨 사용자 경험 최적화

### 시각적 피드백
- **실시간 상태 표시**: 녹화, 로딩, 에러 상태 시각화
- **발화 상태 피드백**: 말하기/대기 상태별 다른 애니메이션
- **진행률 표시**: 치료 세션 진행 상황 실시간 업데이트

### 접근성 고려사항
- **터치 친화적**: 모바일 환경 최적화
- **명확한 메시지**: 상태별 이해하기 쉬운 안내문
- **키보드 접근성**: 마우스 없이도 조작 가능
- **고대비 디자인**: 시각적 인식성 향상

## 📁 주요 파일 구조

```
src/
├── components/common/
│   └── WebcamView.tsx                    # 웹캠 스트리밍 컴포넌트
├── app/main-elder/
│   ├── recall-training/components/
│   │   ├── VoiceMemoryTrainingSession.tsx    # 음성 기억 훈련
│   │   ├── VoicePhotoReminiscenceSession.tsx # 사진 회상 치료
│   │   ├── VoiceStoryTellingSession.tsx      # 이야기 치료
│   │   └── VoiceMusicTherapySession.tsx      # 음악 치료
│   └── daily-survey/
│       ├── SurveyQuestion.tsx            # 설문 음성 녹음
│       └── SurveyForm.tsx               # 설문 폼
└── app/test/
    └── page.tsx                         # 테스트 페이지
```

## 🏆 WebRTC 기술의 혁신적 활용

### 의료 분야 적용 가치
1. **실시간 모니터링**: 치료 중 환자 상태 지속적 관찰
2. **데이터 수집**: 음성, 영상, 감정 데이터 통합 분석
3. **개인화 치료**: 개별 반응에 따른 맞춤형 치료 진행
4. **접근성 향상**: 웹 기반으로 언제 어디서나 이용 가능

### 기술적 혁신 요소
- **다중 스트림 관리**: 미리보기, 녹화, 분석용 스트림 동시 처리
- **실시간 AI 통합**: WebRTC와 머신러닝의 seamless 결합
- **크로스 플랫폼**: 다양한 디바이스와 브라우저에서 일관된 경험
- **성능 최적화**: 제한된 자원에서 최대 품질 구현

## 🚀 향후 확장 가능성

- **원격 진료 연동**: 의료진과의 실시간 화상 상담
- **클라우드 분석**: 수집된 데이터의 서버 측 고급 분석
- **IoT 연동**: 웨어러블 기기와의 데이터 통합
- **VR/AR 확장**: 몰입형 치료 경험 제공

---

## 📞 기술 문의

WebRTC 관련 기술적 문의사항이나 개선 제안이 있으시면 언제든지 연락주시기 바랍니다.

**이 프로젝트는 WebRTC 기술을 의료/치료 목적으로 혁신적으로 활용한 우수 사례입니다.**
