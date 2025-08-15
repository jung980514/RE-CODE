"use client"

export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Play, RotateCcw, Mic, ChevronRight, Camera, Pause } from "lucide-react"
import TrainingCompleteModal from "@/app/main-elder/recall-training/components/TrainingCompleteModal"
import { useRouter } from "next/navigation"
import { synthesizeSpeech, playAudio, stopCurrentAudio } from "@/api/googleTTS/googleTTSService"
import { markRecallTrainingSessionAsCompleted } from "@/lib/auth"
import { FloatingButtons } from "@/components/common/Floting-Buttons"

// 감정 분석 훅
interface EmotionRecord {
  timestamp: number;
  emotion: string;
  confidence: number;
}

type FaceExpressions = {
  neutral: number
  happy: number
  sad: number
  angry: number
  fearful: number
  disgusted: number
  surprised: number
}

type FaceApiModule = {
  nets: {
    tinyFaceDetector: { loadFromUri: (uri: string) => Promise<void> }
    faceExpressionNet: { loadFromUri: (uri: string) => Promise<void> }
  }
  TinyFaceDetectorOptions: new () => object
  detectSingleFace: (
    input: HTMLVideoElement,
    options: object
  ) => { withFaceExpressions: () => Promise<{ expressions: FaceExpressions } | null> }
}

function useEmotionDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  onSecondSample?: (sample: { timestamp: number; emotion: string; confidence: number }) => void,
) {
  // 서버 번들에 포함되지 않도록 동적 임포트로만 사용
  const faceapiRef = useRef<FaceApiModule | null>(null)
  const [emotion, setEmotion] = useState<string>('중립')
  const [confidence, setConfidence] = useState<number>(0)
  const requestRef = useRef<number | undefined>(undefined)
  const modelsLoaded = useRef<boolean>(false)
  const prevExpressions = useRef<FaceExpressions | null>(null)
  const emotionHistory = useRef<EmotionRecord[]>([])
  const lastRecordTime = useRef<number>(0)

  useEffect(() => {
    const loadModels = async () => {
      try {
        // 클라이언트에서만 라이브러리 임포트
        if (!faceapiRef.current) {
          const faceModule = (await import('@vladmandic/face-api')) as unknown as FaceApiModule
          faceapiRef.current = faceModule
        }
        // CDN에서 모델 로드
        await Promise.all([
          faceapiRef.current.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'),
          faceapiRef.current.nets.faceExpressionNet.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model')
        ])
        modelsLoaded.current = true
        console.log('감정 분석 모델 로드 완료')
      } catch (error) {
        console.error('모델 로드 오류:', error)
      }
    }
    loadModels()

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [])

  const detectEmotion = async () => {
    if (!modelsLoaded.current || !videoRef.current || !faceapiRef.current) return

    try {
      const detections = await faceapiRef.current
        .detectSingleFace(videoRef.current, new faceapiRef.current.TinyFaceDetectorOptions())
        .withFaceExpressions()

      if (detections) {
        const expressions = detections.expressions as FaceExpressions
        
        // 감정 점수 조정
        const emotionChange = prevExpressions.current ? 
          Math.abs(expressions.neutral - prevExpressions.current.neutral) : 0

        // 말하기/표정 변화 감지 로직
        const isSpeaking = emotionChange > 0.15
        const isSmiling = expressions.happy > 0.3
        const isNeutralDominant = expressions.neutral > 0.5
        
        // 슬픔 감정 보정
        const sadScore = expressions.sad
        const mouthOpenScore = Math.max(expressions.surprised, expressions.sad)
        const isMouthOpen = mouthOpenScore > 0.3
        
        // 실제 슬픔 표정 판단
        const isActuallySad = sadScore > 0.4 && !isSpeaking && !isSmiling && !isMouthOpen
        
        const adjustedExpressions: FaceExpressions = {
          ...expressions,
          surprised: expressions.surprised * (isSpeaking ? 0.3 : 0.7),
          sad: expressions.sad * (isActuallySad ? 1.0 : 0.1),
          neutral: expressions.neutral * (isNeutralDominant ? 1.4 : 1.2),
          happy: expressions.happy * (isSmiling ? 1.5 : 1.2),
          angry: expressions.angry * (isSpeaking ? 0.7 : 0.9),
          fearful: expressions.fearful * (isSpeaking ? 0.7 : 0.9),
          disgusted: expressions.disgusted * 0.8
        }

        prevExpressions.current = expressions

        let maxExpression = 'neutral'
        let maxConfidence = adjustedExpressions.neutral
        const threshold = 0.3

        // 가장 높은 확률의 감정 찾기
        ;(Object.keys(adjustedExpressions) as Array<keyof FaceExpressions>).forEach((expression) => {
          const value = adjustedExpressions[expression]
          let currentThreshold = threshold
          if (expression === 'surprised') currentThreshold = threshold * 1.5
          if (expression === 'sad') currentThreshold = threshold * 1.4
          
          if (value > maxConfidence && value > currentThreshold) {
            if (isSpeaking && (expression === 'neutral' || expression === 'happy')) {
              maxConfidence = value * 1.2
            } else {
              maxConfidence = value
            }
            maxExpression = expression as string
          }
        })

        // 감정 한글화
        const emotionMap: { [key: string]: string } = {
          neutral: '중립',
          happy: '행복',
          sad: '슬픔',
          angry: '화남',
          fearful: '두려움',
          disgusted: '혐오',
          surprised: '놀람'
        }

        const newEmotion = emotionMap[maxExpression] || '중립'
        if (maxConfidence > threshold) {
          setEmotion(newEmotion)
          setConfidence(Math.round(maxConfidence * 100))

          // 1초마다 감정 상태 기록
          const now = Date.now()
          if (now - lastRecordTime.current >= 1000) {
            const sample = {
              timestamp: now,
              emotion: newEmotion,
              confidence: maxConfidence
            }
            emotionHistory.current.push(sample)
            if (typeof onSecondSample === 'function') {
              onSecondSample(sample)
            }
            lastRecordTime.current = now
          }
        }
      }
    } catch (error) {
      console.error('감정 분석 오류:', error)
    }

    requestRef.current = requestAnimationFrame(detectEmotion)
  }

  useEffect(() => {
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      detectEmotion()
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [videoRef.current?.videoWidth])

  return { emotion, confidence }
}

export function VoiceMusicTherapySession({ onBack }: { onBack: () => void }) {
  const router = useRouter()
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(true)
  const [cameraError, setCameraError] = useState(false)
  const [questions, setQuestions] = useState<Array<{ questionId: number; content: string; mediaUrl: string; mediaType: string; createdAt: string }>>([])
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [questionsLoading, setQuestionsLoading] = useState<boolean>(false)
  const [questionsError, setQuestionsError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [hasRecorded, setHasRecorded] = useState<boolean>(false)
  const [showCompleteModal, setShowCompleteModal] = useState<boolean>(false)
  const [finalEmotion, setFinalEmotion] = useState<string>('NEUTRAL')

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recordedBlobRef = useRef<Blob | null>(null)
  const selectedMimeTypeRef = useRef<string>('video/mp4')
  const selectedExtensionRef = useRef<string>('mp4')
  const sessionEmotionHistory = useRef<Array<{ timestamp: number; emotion: string; confidence: number }>>([])
  const [sessionActive, setSessionActive] = useState<boolean>(false)
  
  // GIF 이미지 관련 상태
  const [isSpeaking, setIsSpeaking] = useState(false)
  const audioContextGifRef = useRef<AudioContext | null>(null)
  const analyserGifRef = useRef<AnalyserNode | null>(null)
  const micStreamGifRef = useRef<MediaStream | null>(null)
  const rafGifRef = useRef<number | null>(null)
  const lastAboveThresholdMsGifRef = useRef<number>(0)
  
  // 말풍선 랜덤 이미지 상태
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
  
  // 감정 분석 훅 사용
  const { emotion, confidence } = useEmotionDetection(
    videoRef,
    (sample) => {
      // 세션 기록은 1초 단위 샘플만 저장
      if (sessionActive) {
        sessionEmotionHistory.current.push(sample)
      }
    }
  )

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

  useEffect(() => {
    initializeCamera()
    const fetchQuestions = async () => {
      try {
        setQuestionsLoading(true)
        setQuestionsError(null)
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/cognitive/questions/audio`, {
          method: 'GET',
          credentials: 'include',
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        const list: Array<{ questionId: number; content: string; mediaUrl: string; mediaType: string; createdAt: string }> =
          Array.isArray(json?.data) ? json.data : []
        setQuestions(list)
        setCurrentIndex(0)
        setHasRecorded(false)
      } catch (e) {
        setQuestionsError('질문을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
      } finally {
        setQuestionsLoading(false)
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchQuestions()

    return () => {
      // 컴포넌트 언마운트 시 모든 오디오 중지
      stopCurrentAudio()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    }
  }, [])

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
      // 녹화 시작 시 TTS와 음악 모두 중지
      stopCurrentAudio()
      const el = audioRef.current
      if (el) {
        el.pause()
        setIsPlaying(false)
      }
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
        'video/mp4; codecs="avc1.424028, mp4a.40.2"', // H.264 + AAC (most compatible)
        'video/mp4; codecs="avc1.42E01E, mp4a.40.2"', // H.264 baseline + AAC
        "video/mp4", // Generic MP4
      ]

      const webmTypes = [
        'video/webm; codecs="vp9, opus"', // VP9 + Opus (good quality)
        'video/webm; codecs="vp8, opus"', // VP8 + Opus (more compatible)
        "video/webm", // Generic WebM
      ]

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
        // 다운로드 대신 메모리에 보관하여 제출에 사용
        recordedBlobRef.current = blob
        selectedMimeTypeRef.current = mimeType
        selectedExtensionRef.current = fileExtension
        setHasRecorded(true)
      }

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event)
      }

      mediaRecorder.start(1000)
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      setSessionActive(true)
      setHasRecorded(false)
      console.log("Recording started with format:", mimeType)
    } catch (error) {
      console.error("Recording failed:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setSessionActive(false)
    }
  }

  const handleAnswerClick = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const toggleAudioPlay = async () => {
    const el = audioRef.current
    if (!el) return
    try {
      if (el.paused) {
        await el.play()
        setIsPlaying(true)
      } else {
        el.pause()
        setIsPlaying(false)
      }
    } catch (e) {
      console.error('오디오 재생 오류:', e)
    }
  }

  const replayAudio = async () => {
    try {
      // 음악과 TTS 함께 다시 재생
      await playMusicAndTTS()
    } catch (e) {
      console.error('오디오 다시재생 오류:', e)
    }
  }

  // s3:// URL을 브라우저에서 재생 가능한 URL로 변환
  const resolveMediaUrl = (rawUrl: string): string => {
    if (!rawUrl) return ''
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl
    const DEFAULT_REGION = 'ap-northeast-2'
    const REGION = process.env.NEXT_PUBLIC_S3_REGION || DEFAULT_REGION
    const PUBLIC_DOMAIN = process.env.NEXT_PUBLIC_S3_PUBLIC_DOMAIN // 예: dxxxxx.cloudfront.net
    const match = rawUrl.match(/^s3:\/\/([^\/]+)\/(.+)$/)
    if (!match) return rawUrl
    const bucket = match[1]
    const key = encodeURIComponent(match[2]).replace(/%2F/g, '/')
    if (PUBLIC_DOMAIN && PUBLIC_DOMAIN.trim().length > 0) {
      return `https://${PUBLIC_DOMAIN}/${key}`
    }
    return `https://${bucket}.s3.${REGION}.amazonaws.com/${key}`
  }

  // 자동 음악 재생 및 TTS 함수
  const playMusicAndTTS = async () => {
    if (questions.length === 0 || questionsLoading) return
    
    try {
      // 기존 오디오와 TTS 중지
      stopCurrentAudio()
      const el = audioRef.current
      if (el) {
        el.pause()
        el.currentTime = 0
      }
      
      // 음악 자동 재생
      if (el && questions[currentIndex]?.mediaUrl) {
        await el.play()
        setIsPlaying(true)
      }
      
      // TTS 재생 (음악과 동시에)
      const question = questions[currentIndex]?.content || ''
      const ttsText = `${question}\n준비가 완료되면 답변하기를 눌러 말씀해주세요.`
      const audioContent = await synthesizeSpeech(ttsText)
      await playAudio(audioContent)
    } catch (error) {
      console.error('음악 또는 TTS 재생 실패:', error)
    }
  }

  // 질문 전환 시 오디오 상태 초기화 및 자동 재생
  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    el.pause()
    el.currentTime = 0
    setIsPlaying(false)
    setHasRecorded(false)
    
    // 질문이 로드된 후 자동 재생
    if (!questionsLoading && questions.length > 0) {
      // 약간의 지연 후 재생 (DOM 업데이트 대기)
      setTimeout(() => {
        playMusicAndTTS()
      }, 500)
    }
  }, [currentIndex, questionsLoading, questions.length])

  // 현재 질문 답변 업로드
  const uploadCurrentAnswer = async (): Promise<void> => {
    try {
      if (!recordedBlobRef.current) {
        console.warn('업로드할 녹화 데이터가 없습니다')
        return
      }
      if (questions.length === 0) return
      const question = questions[currentIndex]
      const userId = (typeof window !== 'undefined' ? localStorage.getItem('userId') : null) || ''
      const formData = new FormData()
      formData.append('userId', userId)
      formData.append('questionId', String(question.questionId))
      formData.append('mediaType', 'audio')
      const filename = `answer-${question.questionId}.${selectedExtensionRef.current}`
      const file = new File([recordedBlobRef.current], filename, { type: selectedMimeTypeRef.current })
      formData.append('videoFile', file)

      setIsUploading(true)
              const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/cognitive/answers`, {
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
    } finally {
      setIsUploading(false)
    }
  }

  const handleNext = () => {
    if (questions.length === 0) return
    
    // 기존 오디오와 TTS 중지
    stopCurrentAudio()
    const el = audioRef.current
    if (el) {
      el.pause()
      el.currentTime = 0
    }
    if (isRecording) {
      stopRecording()
    }
    setIsPlaying(false)
    
    // 업로드 후 다음 또는 완료 처리
    void (async () => {
      await uploadCurrentAnswer()
      const isLast = currentIndex === (questions.length - 1)
      if (isLast) {
        // 세션 감정 요약 계산
        try {
          const records = sessionEmotionHistory.current
          if (records.length > 0) {
            const startTs = records[0].timestamp
            const endTs = records[records.length - 1].timestamp
            const totalDurationSec = Math.max(1, Math.round((endTs - startTs) / 1000))
            const durationPerEmotion: Record<string, number> = {}
            for (let i = 0; i < records.length; i += 1) {
              const emo = records[i].emotion
              durationPerEmotion[emo] = (durationPerEmotion[emo] || 0) + 1
            }
            const thresholdSec = Math.ceil(totalDurationSec * 0.17)
            type Dominant = { emo: string; sec: number }
            let dominant: Dominant | null = null
            Object.entries(durationPerEmotion).forEach(([emo, sec]) => {
              if (emo !== '중립' && sec >= thresholdSec) {
                if (!dominant || sec > dominant.sec) dominant = { emo, sec }
              }
            })
            if (!dominant) {
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
            const chosen = dominant as { emo: string; sec: number } | null
            const emotionCode = (chosen ? (koToEn[chosen.emo] || 'NEUTRAL') : 'NEUTRAL').toUpperCase()
            setFinalEmotion(emotionCode)
            // 기록 초기화
            sessionEmotionHistory.current = []
          } else {
            setFinalEmotion('NEUTRAL')
          }
        } catch (e) {
          console.error('세션 감정 요약 계산 오류:', e)
          setFinalEmotion('NEUTRAL')
        }
        setShowCompleteModal(true)
        return
      }
      setCurrentIndex((prev) => (prev + 1) % questions.length)
      setHasRecorded(false)
    })()
  }

  // 감정별 색상 및 이모지 반환 함수
  const getEmotionColor = (emotion: string) => {
    switch (emotion) {
      case '행복':
        return 'text-yellow-600'
      case '슬픔':
        return 'text-blue-600'
      case '화남':
        return 'text-red-600'
      case '두려움':
        return 'text-purple-600'
      case '혐오':
        return 'text-green-700'
      case '놀람':
        return 'text-orange-600'
      case '중립':
      default:
        return 'text-emerald-600'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4 relative">


      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">

        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Pretendard' }}>들려오는 추억 훈련</h1>
        </div>
      </div>

              {/* Main Content */}
        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Audio Exercise */}
                     <Card className="lg:col-span-2 p-5 md:p-6 bg-white shadow-2xl rounded-2xl min-h-[500px]">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-lg font-medium mb-3" style={{ fontFamily: 'Pretendard' }}>
              <span>🎵</span>
              {questionsLoading ? (
                <span>불러오는 중...</span>
              ) : (
                <span>
                 소리 {questions.length > 0 ? currentIndex + 1 : 0}/{questions.length}
                </span>
              )}
            </div>

            <h2 className="text-2xl font-bold text-emerald-600 mb-2" style={{ fontFamily: 'Pretendard' }}>인지자극훈련 (소리)</h2>
          </div>

                      {/* Audio Player */}
            <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4 mb-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">🎵</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-lg" style={{ fontFamily: 'Pretendard' }}>인지자극훈련</h3>
                <p className="text-emerald-600 text-base" style={{ fontFamily: 'Pretendard' }}>소리</p>
              </div>
            </div>

            <Button onClick={toggleAudioPlay} disabled={questionsLoading || questions.length === 0} className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed">
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white" />
              )}
            </Button>
          </div>

          {/* Hidden/inline audio element */}
          <audio
            ref={audioRef}
            src={questions.length > 0 ? resolveMediaUrl(questions[currentIndex].mediaUrl) : undefined}
            onEnded={() => setIsPlaying(false)}
            preload="none"
          />

                      {/* Question */}
            <div className="mb-5">
            <div className="flex items-start gap-3 mb-4">
              <div>
                {questionsLoading ? (
                  <p className="text-gray-600 text-xl" style={{ fontFamily: 'Pretendard' }}>질문을 불러오는 중입니다...</p>
                ) : questionsError ? (
                  <p className="text-red-600 text-xl" style={{ fontFamily: 'Pretendard' }}>{questionsError}</p>
                ) : questions.length > 0 ? (
                  <div className="text-gray-900 leading-relaxed text-3xl space-y-4" style={{ fontFamily: 'Paperlogy' }}>
                    <p className="mb-4">
                      {questions[currentIndex].content}
                    </p>
                    <p className="text-xl text-gray-700">
                      준비가 완료되면 <strong className="text-emerald-700">답변하기</strong>를 눌러 말씀해주세요
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-600 text-xl" style={{ fontFamily: 'Pretendard' }}>표시할 질문이 없습니다.</p>
                )}
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-6">
            <Button
              variant="outline"
              className="flex-1 h-16 text-2xl border-2 border-emerald-400 text-emerald-800 hover:bg-emerald-50 bg-white focus-visible:ring-4 focus-visible:ring-emerald-300 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ fontFamily: 'Pretendard' }}
              onClick={replayAudio}
              disabled={questionsLoading || questions.length === 0}
              aria-label="음악 다시 재생"
            >
              다시 재생
            </Button>

            <Button
              className={`flex-1 h-16 text-2xl text-white focus-visible:ring-4 focus-visible:ring-emerald-300 rounded-xl ${
                isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
              style={{ fontFamily: 'Pretendard' }}
              onClick={handleAnswerClick}
              aria-pressed={isRecording}
              aria-label={isRecording ? '녹화중지' : (hasRecorded ? '다시답변' : '답변하기')}
            >
              {isRecording ? '녹화중지' : (hasRecorded ? '다시답변' : '답변하기')}
            </Button>

            <Button
              className={`flex-1 h-16 text-2xl text-white focus-visible:ring-4 focus-visible:ring-emerald-300 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl min-w-[150px] flex items-center justify-center gap-3 ${
                isUploading 
                  ? 'bg-emerald-600 cursor-wait' 
                  : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
              style={{ fontFamily: 'Pretendard' }}
              onClick={handleNext}
              disabled={questions.length === 0 || isRecording || !hasRecorded || isUploading}
              aria-label={questions.length > 0 && currentIndex === questions.length - 1 ? '완료하기' : '다음 음성으로 이동'}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>로딩 중</span>
                </>
              ) : (
                questions.length > 0 && currentIndex === questions.length - 1 ? '완료하기' : '다음 음성'
              )}
            </Button>
          </div>
        </Card>

                  {/* Right Panel - Webcam */}
                     <Card className="lg:col-span-1 p-5 md:p-6 bg-white shadow-2xl rounded-2xl min-h-[400px]" aria-label="영상 미리보기">
            <h3 className="text-2xl text-center font-extrabold text-gray-900 mb-4" style={{ fontFamily: 'Pretendard' }}>내 화면</h3>

          {/* Webcam Display */}
          <div className="relative bg-gray-900 rounded-2xl overflow-hidden mb-4" style={{ aspectRatio: "4/3" }}>
            {cameraLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                <Camera className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-sm">카메라를 불러오는 중...</p>
              </div>
            )}

            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                <Camera className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-sm">카메라 접근 실패</p>
                <Button variant="outline" size="sm" className="mt-2 bg-transparent" onClick={initializeCamera}>
                  다시 시도
                </Button>
              </div>
            )}

            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${cameraLoading || cameraError ? "hidden" : ""}`}
            />

            {isRecording && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                녹화중
              </div>
            )}
          </div>

                      {/* Status */}
            <div className="space-y-4 mb-4">
              <div className="flex justify-between items-center text-xl">
                <span className="text-gray-800" style={{ fontFamily: 'Pretendard' }}>현재 감정</span>
                <span className="text-emerald-700 font-extrabold" style={{ fontFamily: 'Pretendard' }}>{emotion}</span>
              </div>
            </div>

            {/* Image Area */}
            <div className="flex-1">
              <div className="h-full bg-white rounded-2xl overflow-visible relative min-h-[200px]">
                {/* 음성 감지에 따른 GIF 이미지 표시 */}
                <div className="flex items-center justify-center h-full">
                  <img
                    src={isSpeaking ? "/images/hearfox.gif" : "/images/speepfox.gif"}
                    alt={isSpeaking ? "말하는 중" : "대기 중"}
                    className="w-4/5 h-4/5 object-contain"
                  />
                </div>
                
                {/* 말풍선 영역 - 녹화 중일 때만 표시, 여우 위에 고정 배치 */}
                {isRecording && (
                  <div className="absolute w-[150px] h-[130px] sm:w-[170px] sm:h-[150px] md:w-[190px] md:h-[170px] lg:w-[210px] lg:h-[190px] xl:w-[240px] xl:h-[210px] z-10 pointer-events-none" style={{ top: 'calc(10% - 120px)', left: 'calc(40% + 40px)' }}>
                    <div className="h-full flex items-center justify-center">
                      {/* 랜덤 말풍선 이미지 표시 */}
                      {currentBalloonImage && (
                        <img
                          src={currentBalloonImage}
                          alt={isSpeaking ? "말하는 중 말풍선" : "대기 중 말풍선"}
                          className="max-w-full max-h-full object-contain transition-all duration-300"
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
        description="수고하셨어요! 확인을 누르면 감정 결과를 전송합니다."
        primaryActionLabel="확인"
        onPrimaryAction={async () => {
          try {
            await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/cognitive/emotions?answerType=COGNITIVE_AUDIO`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ emotion: (finalEmotion || 'NEUTRAL').toUpperCase() }),
            })
            // 감정 데이터 전송 성공 시 로컬스토리지에 완료 상태 저장
            markRecallTrainingSessionAsCompleted('music')
          } catch (e) {
            console.error('감정 전송 실패:', e)
          } finally {
            setShowCompleteModal(false)
            router.push('/main-elder/recall-training')
          }
        }}
      />
      
      {/* 플로팅 버튼 */}
      <FloatingButtons />
    </div>
  )
}
