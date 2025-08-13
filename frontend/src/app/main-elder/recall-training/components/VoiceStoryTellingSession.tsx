"use client"

import { useState, useRef, useEffect } from "react"
import * as faceapi from '@vladmandic/face-api'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, RotateCcw, Mic, ChevronRight, Camera, Clock, CircleQuestionMark } from "lucide-react"
import TrainingCompleteModal from "@/app/main-elder/recall-training/components/TrainingCompleteModal"
import { useRouter } from "next/navigation"
import { synthesizeSpeech, playAudio, stopCurrentAudio } from "@/api/googleTTS/googleTTSService"
import { markRecallTrainingSessionAsCompleted } from "@/lib/auth"


interface VoiceSessionProps {

  onBack: () => void
}

export function VoiceStoryTellingSession({ onBack }: VoiceSessionProps) {
  const router = useRouter()
  const [isRecording, setIsRecording] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(true)
  const [cameraError, setCameraError] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  // 오디오 비주얼라이저 상태/레퍼런스
  const [audioLevel, setAudioLevel] = useState(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)
  // 녹화 파일 보관 및 업로드 상태
  const recordedBlobRef = useRef<Blob | null>(null)
  const selectedMimeTypeRef = useRef<string>('video/mp4')
  const selectedExtensionRef = useRef<string>('mp4')
  const [isUploading, setIsUploading] = useState(false)

  // 설문 질문 상태
  interface SurveyQuestion {
    questionId: number
    content: string
    createdAt: string
  }
  const [questions, setQuestions] = useState<SurveyQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0)
  const [questionsLoading, setQuestionsLoading] = useState<boolean>(true)
  const [questionsError, setQuestionsError] = useState<string | null>(null)
  const [showCompleteModal, setShowCompleteModal] = useState<boolean>(false)
  const [hasRecorded, setHasRecorded] = useState<boolean>(false)
  const [finalEmotion, setFinalEmotion] = useState<string>('NEUTRAL')
  
  // GIF 이미지 관련 상태
  const [isSpeaking, setIsSpeaking] = useState(false)
  const audioContextGifRef = useRef<AudioContext | null>(null)
  const analyserGifRef = useRef<AnalyserNode | null>(null)
  const micStreamGifRef = useRef<MediaStream | null>(null)
  const rafGifRef = useRef<number | null>(null)
  const lastAboveThresholdMsGifRef = useRef<number>(0)
  
  // 네트워크 상자 랜덤 이미지 상태
  const [currentBalloonImage, setCurrentBalloonImage] = useState<string>('')

  // 랜덤 말풍선 이미지 선택 함수
  const getRandomBalloonImage = (isSpeaking: boolean): string => {
    const randomNumber = Math.floor(Math.random() * 5) + 1 // 1~5 랜덤
    const folder = isSpeaking ? 'talk' : 'nottalk'
    return `/images/talkballoon/${folder}/${randomNumber}.png`
  }

  // isSpeaking 상태 변경 시 랜덤 이미지 업데이트
  useEffect(() => {
    setCurrentBalloonImage(getRandomBalloonImage(isSpeaking))
  }, [isSpeaking])

  // 컴포넌트 마운트 시 초기 이미지 설정
  useEffect(() => {
    setCurrentBalloonImage(getRandomBalloonImage(false))
  }, [])

  // 감정 분석 훅 (VoiceStoryTellingSession과 동일한 방식, face-api 사용)
  interface EmotionRecord {
    timestamp: number
    emotion: string
    confidence: number
  }

  function useEmotionDetection(
    videoElRef: React.RefObject<HTMLVideoElement | null>,
    detectEnabled: boolean,
    onSecondSample?: (sample: { timestamp: number; emotion: string; confidence: number }) => void,
  ) {
    const [emotion, setEmotion] = useState<string>('중립')
    const [confidence, setConfidence] = useState<number>(0)
    const requestRef = useRef<number | undefined>(undefined)
    const modelsLoaded = useRef<boolean>(false)
    const prevExpressions = useRef<faceapi.FaceExpressions | null>(null)
    const emotionHistory = useRef<EmotionRecord[]>([])
    const lastRecordTime = useRef<number>(0)

    useEffect(() => {
      const loadModels = async () => {
        try {
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'),
            faceapi.nets.faceExpressionNet.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'),
          ])
          modelsLoaded.current = true
        } catch (error) {
          console.error('모델 로드 오류:', error)
        }
      }
      loadModels()

      return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current)
      }
    }, [])

    const detectEmotion = async () => {
      if (!modelsLoaded.current || !videoElRef.current) {
        requestRef.current = requestAnimationFrame(detectEmotion)
        return
      }
      try {
        const detections = await faceapi
          .detectSingleFace(videoElRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions()

        if (detections) {
          const expressions = detections.expressions
          const emotionChange = prevExpressions.current ? Math.abs(expressions.neutral - prevExpressions.current.neutral) : 0
          const isSpeaking = emotionChange > 0.15
          const isSmiling = expressions.happy > 0.3
          const isNeutralDominant = expressions.neutral > 0.5
          const sadScore = expressions.sad
          const mouthOpenScore = Math.max(expressions.surprised, expressions.sad)
          const isMouthOpen = mouthOpenScore > 0.3
          const isActuallySad = sadScore > 0.4 && !isSpeaking && !isSmiling && !isMouthOpen

          const adjusted = {
            ...expressions,
            surprised: expressions.surprised * (isSpeaking ? 0.3 : 0.7),
            sad: expressions.sad * (isActuallySad ? 1.0 : 0.1),
            neutral: expressions.neutral * (isNeutralDominant ? 1.4 : 1.2),
            happy: expressions.happy * (isSmiling ? 1.5 : 1.2),
            angry: expressions.angry * (isSpeaking ? 0.7 : 0.9),
            fearful: expressions.fearful * (isSpeaking ? 0.7 : 0.9),
            disgusted: expressions.disgusted * 0.8,
          }

          prevExpressions.current = expressions

          let winner: keyof typeof adjusted = 'neutral'
          let max = adjusted.neutral
          const threshold = 0.3
          Object.entries(adjusted).forEach(([key, val]) => {
            let th = threshold
            if (key === 'surprised') th = threshold * 1.5
            if (key === 'sad') th = threshold * 1.4
            if (val > max && val > th) {
              max = isSpeaking && (key === 'neutral' || key === 'happy') ? val * 1.2 : val
              winner = key as keyof typeof adjusted
            }
          })

          const map: Record<string, string> = {
            neutral: '중립',
            happy: '행복',
            sad: '슬픔',
            angry: '화남',
            fearful: '두려움',
            disgusted: '혐오',
            surprised: '놀람',
          }

          const newEmotion = map[winner] || '중립'
          if (max > threshold) {
            setEmotion(newEmotion)
            setConfidence(max)
            const now = Date.now()
            if (now - lastRecordTime.current >= 1000) {
              const sample = { timestamp: now, emotion: newEmotion, confidence: max }
              emotionHistory.current.push(sample)
              if (typeof onSecondSample === 'function') {
                onSecondSample(sample)
              }
              lastRecordTime.current = now
            }
          }
        }
      } catch (e) {
        console.error('감정 분석 오류:', e)
      }
      requestRef.current = requestAnimationFrame(detectEmotion)
    }

    const analyzeEmotionHistory = () => {
      if (emotionHistory.current.length === 0) return
      const records = emotionHistory.current
      const totalSec = (records[records.length - 1].timestamp - records[0].timestamp) / 1000
      const durations: Record<string, number> = {}
      const confidences: Record<string, number[]> = {}
      records.forEach((r, i) => {
        const d = i === records.length - 1 ? 1 : (records[i + 1].timestamp - r.timestamp) / 1000
        durations[r.emotion] = (durations[r.emotion] || 0) + d
        if (!confidences[r.emotion]) {
          confidences[r.emotion] = []
        }
        confidences[r.emotion].push(r.confidence)
      })
      const dominant = Object.entries(durations).find(([emo, dur]) => emo !== '중립' && (dur / totalSec * 100) > 17)
      console.log('=== 감정 분석 결과 ===')
      console.log(`총 녹화 시간: ${totalSec.toFixed(1)}초`)
      if (dominant) {
        const [emo, dur] = dominant
        const pct = (dur / totalSec * 100).toFixed(1)
        const avg = (confidences[emo].reduce((a, b) => a + b, 0) / confidences[emo].length * 100).toFixed(1)
        console.log(`주요 감정: ${emo} (${pct}%, 평균 신뢰도: ${avg}%)`)
      } else {
        const nd = durations['중립'] || 0
        const np = (nd / totalSec * 100).toFixed(1)
        const na = confidences['중립'] ? (confidences['중립'].reduce((a, b) => a + b, 0) / confidences['중립'].length * 100).toFixed(1) : '0.0'
        console.log(`주요 감정: 중립 (${np}%, 평균 신뢰도: ${na}%)`)
      }
      console.log('==================')
      emotionHistory.current = []
      lastRecordTime.current = 0
    }

    useEffect(() => {
      if (videoElRef.current && detectEnabled && modelsLoaded.current) {
        detectEmotion()
        if (emotionHistory.current.length === 0) {
          emotionHistory.current = []
          lastRecordTime.current = Date.now()
        }
      } else {
        setEmotion('중립')
        setConfidence(0)
        if (requestRef.current) cancelAnimationFrame(requestRef.current)
      }
      return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current)
      }
    }, [videoElRef.current, detectEnabled, modelsLoaded.current])

    return { emotion, confidence, analyzeEmotionHistory }
  }

  // 세션 전체 감정 기록 (1초 단위 샘플)
  const sessionEmotionHistory = useRef<EmotionRecord[]>([])
  const [sessionActive, setSessionActive] = useState<boolean>(false)

  const { emotion, confidence, analyzeEmotionHistory } = useEmotionDetection(
    videoRef,
    sessionActive,
    (sample) => {
      sessionEmotionHistory.current.push(sample)
    }
  )

  useEffect(() => {
    initializeCamera()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  // 음성 감지 초기화 (GIF 이미지용)
  useEffect(() => {
    let cancelled = false
    const initAudioDetection = async () => {
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        if (cancelled) {
          micStream.getTracks().forEach(t => t.stop())
          return
        }
        micStreamGifRef.current = micStream
        
        // 호환: 표준 AudioContext 우선, 없으면 webkitAudioContext 사용
        let audioContext: AudioContext
        if ('AudioContext' in window) {
          const Ctor = window.AudioContext as {
            new (contextOptions?: AudioContextOptions): AudioContext
          }
          audioContext = new Ctor()
        } else if ('webkitAudioContext' in window) {
          const Ctor = (window as unknown as {
            webkitAudioContext: { new (contextOptions?: AudioContextOptions): AudioContext }
          }).webkitAudioContext
          audioContext = new Ctor()
        } else {
          throw new Error('Web Audio API not supported')
        }
        audioContextGifRef.current = audioContext
        const source = audioContext.createMediaStreamSource(micStream)
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 2048
        analyser.smoothingTimeConstant = 0.8
        analyserGifRef.current = analyser
        source.connect(analyser)

        const data = new Uint8Array(analyser.frequencyBinCount)
        const SPEAKING_THRESHOLD = 12 // 임계값(조정 가능)
        const SILENCE_HOLD_MS = 3000  // 무음 3초 유지 시에만 비발화로 전환

        const loop = () => {
          if (!analyserGifRef.current) return
          analyserGifRef.current.getByteTimeDomainData(data)
          // 128 기준으로 편차 RMS 계산
          let sumSquares = 0
          for (let i = 0; i < data.length; i++) {
            const v = data[i] - 128
            sumSquares += v * v
          }
          const rms = Math.sqrt(sumSquares / data.length)
          const isNowSpeaking = rms > SPEAKING_THRESHOLD
          const now = performance.now()
          if (isNowSpeaking) {
            // 발화 감지: 즉시 speaking 전환, 타임스탬프 갱신
            if (!isSpeaking) {
              setIsSpeaking(true)
            }
            lastAboveThresholdMsGifRef.current = now
          } else {
            // 무음: 마지막 발화 시점으로부터 3초 경과 시에만 speaking 해제
            if (isSpeaking) {
              if (now - lastAboveThresholdMsGifRef.current >= SILENCE_HOLD_MS) {
                setIsSpeaking(false)
              }
            }
          }
          rafGifRef.current = requestAnimationFrame(loop)
        }
        rafGifRef.current = requestAnimationFrame(loop)
      } catch (e) {
        console.warn('마이크 접근/분석 초기화 실패:', e)
      }
    }

    initAudioDetection()
    return () => {
      cancelled = true
      if (rafGifRef.current) {
        cancelAnimationFrame(rafGifRef.current)
        rafGifRef.current = null
      }
      if (analyserGifRef.current) {
        try { analyserGifRef.current.disconnect() } catch {}
        analyserGifRef.current = null
      }
      if (audioContextGifRef.current) {
        try { audioContextGifRef.current.close() } catch {}
        audioContextGifRef.current = null
      }
      if (micStreamGifRef.current) {
        try { micStreamGifRef.current.getTracks().forEach(t => t.stop()) } catch {}
        micStreamGifRef.current = null
      }
    }
  }, [isSpeaking])

  const initializeCamera = async () => {
    try {
      setCameraLoading(true)
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

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }

      setCameraLoading(false)
      setCameraError(false)
    } catch (error) {
      console.error("Camera access failed:", error)
      setCameraLoading(false)
      setCameraError(true)
    }
  }

  const startRecording = async () => {
    if (!streamRef.current) return

    try {
      // 재생 중인 TTS 중지
      stopCurrentAudio()

      const videoTracks = streamRef.current.getVideoTracks()
      const audioTracks = streamRef.current.getAudioTracks()

      if (videoTracks.length === 0) {
        console.error("No video track available")
        return
      }

      if (audioTracks.length === 0) {
        console.warn("No audio track available - recording video only")
      } else {
        console.log("Audio tracks found:", audioTracks.length)
      }

      let mimeType = "video/webm"
      let fileExtension = "webm"

      const mp4Types = [
        'video/mp4; codecs="avc1.424028, mp4a.40.2"',
        'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
        "video/mp4",
      ]

      const webmTypes = ['video/webm; codecs="vp9, opus"', 'video/webm; codecs="vp8, opus"', "video/webm"]

      for (const type of mp4Types) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type
          fileExtension = "mp4"
          console.log("Using MP4 format:", type)
          break
        }
      }

      if (fileExtension === "webm") {
        for (const type of webmTypes) {
          if (MediaRecorder.isTypeSupported(type)) {
            mimeType = type
            fileExtension = "webm"
            console.log("Using WebM format:", type)
            break
          }
        }
      }

      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType,
        audioBitsPerSecond: 128000,
        videoBitsPerSecond: 2500000,
      })

      const chunks: BlobPart[] = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
          console.log("Data chunk received:", event.data.size, "bytes")
        }
      }

      mediaRecorder.onstop = () => {
        console.log("Recording stopped, creating blob with", chunks.length, "chunks")
        const blob = new Blob(chunks, { type: mimeType })
        console.log("Final blob size:", blob.size, "bytes, type:", blob.type)
        // 다운로드 대신 메모리에 보관
        recordedBlobRef.current = blob
        selectedMimeTypeRef.current = mimeType
        selectedExtensionRef.current = fileExtension
      }

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event)
      }

      mediaRecorder.start(1000)
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      // 세션 시작점: 첫 녹화 시작 시 세션 기록 초기화 및 감정 수집 활성화
      setSessionActive((prev) => {
        if (!prev) {
          sessionEmotionHistory.current = []
        }
        return true
      })
      setHasRecorded(false)
      console.log("Recording started with format:", mimeType)

      // 오디오 비주얼라이저 초기화
      try {
        if (streamRef.current && streamRef.current.getAudioTracks().length > 0) {
          const AnyWindow = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }
          const Ctor = AnyWindow.AudioContext ?? AnyWindow.webkitAudioContext
          if (Ctor) {
            const ctx = new Ctor()
            const src = ctx.createMediaStreamSource(streamRef.current)
            const analyser = ctx.createAnalyser()
            analyser.fftSize = 256
            src.connect(analyser)
            audioContextRef.current = ctx
            analyserRef.current = analyser
            const data = new Uint8Array(analyser.frequencyBinCount)
            const loop = () => {
              if (!analyserRef.current) return
              analyserRef.current.getByteFrequencyData(data)
              const avg = data.reduce((a, b) => a + b, 0) / data.length
              setAudioLevel(avg)
              rafRef.current = requestAnimationFrame(loop)
            }
            loop()
          }
        } else {
          setAudioLevel(0)
        }
      } catch (e) {
        console.warn('오디오 비주얼라이저 초기화 실패:', e)
      }
    } catch (error) {
      console.error("Recording failed:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      // 녹화 종료 시 감정 기록 요약 출력
      analyzeEmotionHistory()
      setHasRecorded(true)
      // 비주얼라이저 정리
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      try {
        if (audioContextRef.current) {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          audioContextRef.current.close()
        }
      } catch {}
      audioContextRef.current = null
      analyserRef.current = null
      setAudioLevel(0)
    }
  }

  const handleAnswerClick = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  // 현재 질문 답변 업로드
  const uploadCurrentAnswer = async (): Promise<void> => {
    try {
      if (!recordedBlobRef.current) {
        console.warn('업로드할 녹화 데이터가 없습니다')
        return
      }
      if (questions.length === 0) return
      const question = questions[currentQuestionIndex]
      const userId = (typeof window !== 'undefined' ? localStorage.getItem('userId') : null) || ''
      const formData = new FormData()
      formData.append('userId', userId)
      formData.append('questionId', String(question.questionId))
      formData.append('mediaType', 'video')
      const filename = `answer-${question.questionId}.${selectedExtensionRef.current}`
      const file = new File([recordedBlobRef.current], filename, { type: selectedMimeTypeRef.current })
      formData.append('videoFile', file)

      setIsUploading(true)
      const res = await fetch('https://recode-my-life.site/api/personal/answers', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      if (!res.ok) {
        throw new Error(`업로드 실패: HTTP ${res.status}`)
      }
      // 업로드 성공 후 보관 데이터 해제
      recordedBlobRef.current = null
    } catch (e) {
      console.error('답변 업로드 에러:', e)
      // 실패 시 보관 데이터는 유지하여 재시도 가능
    } finally {
      setIsUploading(false)
    }
  }

  // 질문 불러오기 (쿠키 세션 포함)
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setQuestionsLoading(true)
        setQuestionsError(null)
        const response = await fetch('https://recode-my-life.site/api/personal/questions', {
          method: 'GET',
          credentials: 'include',
        })
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const json = await response.json() as { data?: SurveyQuestion[] }
        const list = Array.isArray(json?.data) ? json.data as SurveyQuestion[] : []
        setQuestions(list)
        setCurrentQuestionIndex(0)
      } catch (e) {
        setQuestionsError('질문을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
      } finally {
        setQuestionsLoading(false)
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchQuestions()
  }, [])

  const handleNextQuestion = async () => {
    if (questions.length === 0) return
    stopCurrentAudio()
    await uploadCurrentAnswer()
    setCurrentQuestionIndex((prev) => (prev + 1) % questions.length)
    setHasRecorded(false)
  }

  const handleComplete = () => {
    setShowCompleteModal(true)
  }

  const handleNextOrComplete = async () => {
    const total = questions.length
    if (total > 0 && currentQuestionIndex === total - 1) {
      stopCurrentAudio()
      await uploadCurrentAnswer()
      // 세션 최종 감정 산출 및 로그
      try {
        const records = sessionEmotionHistory.current
        if (records.length > 0) {
          const startTs = records[0].timestamp
          const endTs = records[records.length - 1].timestamp
          const totalDurationSec = Math.max(1, Math.round((endTs - startTs) / 1000))
          // 1초 단위 샘플만 사용(이미 1초 단위로 추가됨)
          const durationPerEmotion: Record<string, number> = {}
          records.forEach(() => {})
          for (let i = 0; i < records.length; i += 1) {
            const emo = records[i].emotion
            durationPerEmotion[emo] = (durationPerEmotion[emo] || 0) + 1
          }
          const thresholdSec = Math.ceil(totalDurationSec * 0.17)
          // 지배적 감정 찾기 (중립 제외 우선)
          type Dominant = { emo: string; sec: number }
          let dominant: Dominant | null = null
          Object.entries(durationPerEmotion).forEach(([emo, sec]) => {
            if (emo !== '중립' && sec >= thresholdSec) {
              if (!dominant || sec > dominant.sec) dominant = { emo, sec }
            }
          })
          if (!dominant) {
            // 중립만 임계치를 넘었거나, 어떤 감정도 임계치를 넘지 못한 경우, 최다 지속 감정을 선택
            Object.entries(durationPerEmotion).forEach(([emo, sec]) => {
              if (!dominant || sec > dominant.sec) dominant = { emo, sec }
            })
          }
          const koToEn: Record<string, string> = {
            '중립': 'NEUTRAL',
            '행복': 'HAPPY',
            '슬픔': 'SAD',
            '화남': 'ANGRY',
            '두려움': 'FEAR',
            '혐오': 'DISGUST',
            '놀람': 'SURPRISED',
          }
          let finalEmotionEn = 'NEUTRAL'
          if (dominant && typeof (dominant as Dominant).emo === 'string') {
            const key = (dominant as Dominant).emo
            finalEmotionEn = koToEn[key] || 'NEUTRAL'
          }
          console.log(`[세션 감정 요약] 총 ${totalDurationSec}s, 임계 ${thresholdSec}s, 최종 감정: ${finalEmotionEn}`)
          setFinalEmotion(finalEmotionEn)
        }
      } catch (e) {
        console.error('세션 감정 요약 오류:', e)
      }
      // 완료 버튼 시점에 감정 측정 중단
      setSessionActive(false)
      // 메모리 세션 완료 플래그 저장
      markRecallTrainingSessionAsCompleted('story')
      handleComplete()
    } else {
      await handleNextQuestion()
    }
  }

  const handleCompleteAndSubmitEmotion = async () => {
    try {
      const payload = { emotion: (finalEmotion || 'NEUTRAL').toUpperCase() }
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/personal/emotions`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch (e) {
      console.error('감정 전송 실패:', e)
    } finally {
      router.push('/main-elder/recall-training')
    }
  }

  // 질문 TTS 재생
  const replayQuestionTTS = async () => {
    try {
      if (questions.length === 0) return
      stopCurrentAudio()
      const text = `${questions[currentQuestionIndex]?.content}\n준비되시면 답변하기 버튼을 눌러 시작해주세요.`
      const audioContent = await synthesizeSpeech(text)
      await playAudio(audioContent)
    } catch (e) {
      console.error('TTS 에러:', e)
    }
  }

  // 질문 변경/로드 시 자동 TTS
  useEffect(() => {
    const speak = async () => {
      if (questionsLoading) return
      if (questions.length === 0) return
      try {
        const text = `${questions[currentQuestionIndex]?.content}\n준비되시면 답변하기 버튼을 눌러 시작해주세요.`
        const audioContent = await synthesizeSpeech(text)
        await playAudio(audioContent)
      } catch (e) {
        console.error('TTS 에러:', e)
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    speak()
    return () => {
      stopCurrentAudio()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionsLoading, currentQuestionIndex, questions.length])

  // 질문 로드 완료 시 초기 상태
  useEffect(() => {
    if (!questionsLoading) {
      setHasRecorded(false)
    }
  }, [questionsLoading])

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-orange-100 to-red-100 pt-1 pb-0 px-4 md:pt-6 md:pb-0 md:px-8 relative">
      {/* 절대위치 회색 사각형 오버레이 - 디자인에 영향 없음 */}
      <div className="absolute inset-0 z-50 pointer-events-none">
        <div className="relative w-full h-full">

          {/* 우하단 투명 이미지 영역 - 녹화 중일 때만 표시 */}
          {isRecording && (
            <div className="absolute bottom-40 right-40 w-50 h-42">
              <div className="h-full flex items-center justify-center">
                {/* 랜덤 말풍선 이미지 표시 */}
                {currentBalloonImage && (
                  <img
                    src={currentBalloonImage}
                    alt={isSpeaking ? "말하는 중 말풍선" : "대기 중 말풍선"}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      console.warn('말풍선 이미지 로드 실패:', currentBalloonImage)
                      // 이미지 로드 실패 시 기본 이미지로 대체
                      const target = e.target as HTMLImageElement
                      target.src = '/images/talkballoon/nottalk/1.png'
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="h-full flex items-start justify-center">
        <div style={{ transform: 'scale(0.75)', transformOrigin: 'top center' }}>
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">

        <div className="text-left">
          <h1 className="text-6xl md:text-5xl font-extrabold text-gray-900">
            기억 꺼내기 훈련
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto grid lg:grid-cols-3 gap-6">
        {/* Left Panel - Question Exercise */}
        <Card className="lg:col-span-2 p-6 md:p-8 bg-white shadow-2xl rounded-2xl min-h-[900px]">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-4 bg-orange-100 text-orange-800 px-8 py-4 rounded-full text-2xl font-bold mb-6">
              <CircleQuestionMark className="w-8 h-8" aria-hidden="true" />
              질문 {questions.length > 0 ? currentQuestionIndex + 1 : 0}/{questions.length}
            </div>
          </div>

          {/* Question */}
          <div className="mb-16">
            <div className="text-center">
              <h3 className=" text-red-700 text-4xl mb-8">RE:CODE는 궁금해요!</h3>
              <div className="max-w-4xl mx-auto">
                {questionsLoading ? (
                  <p className="text-gray-600 text-2xl">질문을 불러오는 중입니다...</p>
                ) : questionsError ? (
                  <p className="text-red-600 text-2xl">{questionsError}</p>
                ) : questions.length > 0 ? (
                  <div className="text-gray-900 leading-relaxed text-4xl text-bold space-y-6" style={{ fontFamily: 'Pretendard' }}>
                    <p className="mb-6">
                      {questions[currentQuestionIndex]?.content}
                    </p>
                    <p className="text-3xl text-gray-700">
                      준비되시면 <strong className="text-orange-700">답변하기</strong> 버튼을 눌러 시작해주세요.
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-600 text-2xl">표시할 질문이 없습니다.</p>
                )}
              </div>
            </div>
          </div>

          {/* 오디오 비주얼라이저 */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 mb-12">
            <div className="flex items-end gap-2 h-20">
              {Array.from({ length: 20 }, (_, i) => {
                const amplified = (audioLevel / 255) * 100 * 2.5
                const barHeight = Math.min(100, Math.max(8, (amplified * (i + 1)) / 20))
                return (
                  <div
                    key={i}
                    className="flex-1 bg-red-300 rounded-sm transition-all duration-100"
                    style={{ height: `${barHeight}%` }}
                  />
                )
              })}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-6">
            <Button
              onClick={replayQuestionTTS}
              variant="outline"
              className="flex-1 h-20 text-4xl border-2 border-orange-400 text-orange-800 hover:bg-orange-50 bg-white focus-visible:ring-4 focus-visible:ring-orange-300 rounded-xl"
              aria-label="질문 다시 재생"
            >
              다시 재생
            </Button>

            <Button
              onClick={handleAnswerClick}
              aria-pressed={isRecording}
              aria-label={isRecording ? '녹화중지' : (hasRecorded ? '다시답변' : '답변하기')}
              className={`flex-1 h-20 text-4xl text-white focus-visible:ring-4 focus-visible:ring-orange-300 rounded-xl ${
                isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {isRecording ? '녹화중지' : (hasRecorded ? '다시답변' : '답변하기')}
            </Button>

            <Button
              onClick={handleNextOrComplete}
              className="flex-1 h-20 text-4xl bg-orange-700 hover:bg-orange-800 text-white focus-visible:ring-4 focus-visible:ring-orange-300 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl"
              aria-label={questions.length > 0 && currentQuestionIndex === questions.length - 1 ? '완료하기' : '다음 질문으로 이동'}
              disabled={questions.length === 0 || isRecording || !hasRecorded}
            >
              {questions.length > 0 && currentQuestionIndex === questions.length - 1 ? '완료하기' : '다음 질문'}
            </Button>
          </div>
        </Card>

        {/* Right Panel - Webcam */}
        <Card className="lg:col-span-1 p-6 md:p-8 bg-white shadow-2xl rounded-2xl min-h-[800px]" aria-label="영상 미리보기">
          <h3 className="text-2xl text-center font-extrabold text-gray-900 mb-4">내 화면</h3>

          {/* Webcam Display */}
          <div className="relative bg-gray-900 rounded-2xl overflow-hidden mb-6" style={{ aspectRatio: '4/3' }}>
            {cameraLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <Camera className="w-16 h-16 mb-4 opacity-80" aria-hidden="true" />
                <p className="text-xl">카메라를 불러오는 중...</p>
              </div>
            )}

            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <Camera className="w-16 h-16 mb-4 opacity-80" aria-hidden="true" />
                <p className="text-xl">카메라 접근 실패</p>
                <Button
                  variant="outline"
                  className="mt-3 bg-white text-gray-900 border-2"
                  onClick={initializeCamera}
                  aria-label="카메라 다시 시도"
                >
                  다시 시도
                </Button>
              </div>
            )}

            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              aria-label="웹캠 미리보기"
              className={`w-full h-full object-cover ${cameraLoading || cameraError ? 'hidden' : ''}`}
            />

            {/* 녹화 상태 라이브 리전 */}
            <div className="sr-only" aria-live="polite" aria-atomic="true">
              {isRecording ? '녹화 중입니다' : '녹화가 중지되었습니다'}
            </div>

            {isRecording && (
              <div className="absolute top-4 right-4 flex items-center gap-3 bg-red-600 text-white px-4 py-2 rounded-full text-xl">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                녹화 중...
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center text-xl">
              <span className="text-gray-800">현재 감정</span>
              <span className="text-blue-700 font-extrabold">{emotion}</span>
            </div>
          </div>

          {/* Image Area */}
          <div className="flex-1">
            <div className="h-full bg-white rounded-2xl overflow-hidden relative min-h-[300px]">
              {/* 음성 감지에 따른 GIF 이미지 표시 */}
              <div className="flex items-center justify-center h-full">
                <img
                  src={isSpeaking ? "/images/hearfox.gif" : "/images/speepfox.gif"}
                  alt={isSpeaking ? "말하는 중" : "대기 중"}
                  className="w-4/5 h-4/5 object-contain"
                />
              </div>
              
              {/* 플레이스홀더 (이미지 로드 실패 시 대체) */}
              <div className="absolute inset-0 flex items-center justify-center text-gray-400" style={{ display: 'none' }}>
                <Camera className="w-16 h-16 opacity-50" aria-hidden="true" />
              </div>
            </div>
          </div>
        </Card>
      </div>
      {/* 완료 모달 */}
      <TrainingCompleteModal
        open={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="훈련이 완료되었습니다"
        description="수고하셨어요! 다음 단계로 진행하시거나 창을 닫아주세요."
        primaryActionLabel="확인"
        onPrimaryAction={handleCompleteAndSubmitEmotion}
      />
        </div>
      </div>
    </div>
  )
}

export default VoiceStoryTellingSession