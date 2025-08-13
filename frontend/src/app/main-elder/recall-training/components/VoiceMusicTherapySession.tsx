"use client"

export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Play, RotateCcw, Mic, ChevronRight, Camera, Pause } from "lucide-react"
import TrainingCompleteModal from "@/app/main-elder/recall-training/components/TrainingCompleteModal"
import { useRouter } from "next/navigation"

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

  useEffect(() => {
    initializeCamera()
    const fetchQuestions = async () => {
      try {
        setQuestionsLoading(true)
        setQuestionsError(null)
            const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + '/api/cognitive/questions/audio', {
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
    const el = audioRef.current
    if (!el) return
    try {
      el.currentTime = 0
      await el.play()
      setIsPlaying(true)
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

  // 질문 전환 시 오디오 상태 초기화
  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    el.pause()
    el.currentTime = 0
    setIsPlaying(false)
    setHasRecorded(false)
  }, [currentIndex])

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
  const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + '/api/cognitive/answers', {
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

  const getEmotionEmoji = (emotion: string) => {
    switch (emotion) {
      case '행복':
        return '😊'
      case '슬픔':
        return '😢'
      case '화남':
        return '😠'
      case '두려움':
        return '😨'
      case '혐오':
        return '🤢'
      case '놀람':
        return '😲'
      case '중립':
      default:
        return '😐'
    }
  }

  const getEmotionProgressColor = (emotion: string) => {
    switch (emotion) {
      case '행복':
        return 'bg-yellow-500'
      case '슬픔':
        return 'bg-blue-500'
      case '화남':
        return 'bg-red-500'
      case '두려움':
        return 'bg-purple-500'
      case '혐오':
        return 'bg-green-600'
      case '놀람':
        return 'bg-orange-500'
      case '중립':
      default:
        return 'bg-emerald-500'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">

        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">들려오는 추억 훈련</h1>
          <p className="text-gray-600">음악과 함께 소중한 추억을 되살려보세요</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
        {/* Left Panel - Audio Exercise */}
        <Card className="p-8 bg-white/80 backdrop-blur-sm shadow-lg">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span>🎵</span>
              {questionsLoading ? (
                <span>불러오는 중...</span>
              ) : (
                <span>
                  노래 {questions.length > 0 ? currentIndex + 1 : 0}/{questions.length}
                </span>
              )}
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">인지자극훈련</h2>
            <p className="text-emerald-600 font-medium">소리</p>
          </div>

          {/* Audio Player */}
          <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">🎵</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">인지자극훈련</h3>
                <p className="text-emerald-600 text-sm">소리</p>
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
          <div className="mb-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">🎵</span>
              </div>
              <div>
                <h3 className="font-semibold text-emerald-600 mb-2">RE:CODE는 궁금해요</h3>
                {questionsLoading ? (
                  <p className="text-gray-600">질문을 불러오는 중입니다...</p>
                ) : questionsError ? (
                  <p className="text-red-600">{questionsError}</p>
                ) : questions.length > 0 ? (
                  <p className="text-gray-700 leading-relaxed">
                    {questions[currentIndex].content}
                    <br />
                    준비가 완료되면 답변하기를 눌러 말씀해주세요
                  </p>
                ) : (
                  <p className="text-gray-600">표시할 질문이 없습니다.</p>
                )}
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={replayAudio}
              disabled={questionsLoading || questions.length === 0}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              다시재생
            </Button>

            <Button
              className={`flex-1 ${isRecording ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"}`}
              onClick={handleAnswerClick}
            >
              <Mic className="w-4 h-4 mr-2" />
              {isRecording ? "녹화중지" : "답변하기"}
            </Button>

            <Button
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleNext}
              disabled={questions.length === 0 || isRecording || !hasRecorded || isUploading}
            >
              {questions.length > 0 && currentIndex === questions.length - 1 ? '완료하기' : '다음노래'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>

        {/* Right Panel - Webcam */}
        <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">내 화면(김수정)</h3>

          {/* Webcam Display */}
          <div className="relative bg-gray-900 rounded-2xl overflow-hidden mb-6" style={{ aspectRatio: "4/3" }}>
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
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800">감정 분석</h4>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">현재 감정:</span>
              <span className={`font-medium ${getEmotionColor(emotion)} flex items-center gap-2`}>
                <span className="text-lg">{getEmotionEmoji(emotion)}</span>
                {emotion}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">신뢰도:</span>
              <span className="text-emerald-600 font-medium">{confidence}%</span>
            </div>

            {/* 감정 진행바 */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">감정 강도</span>
                <span className="text-gray-600">{confidence}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getEmotionProgressColor(emotion)}`}
                  style={{ width: `${Math.min(confidence, 100)}%` }}
                ></div>
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
            await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + '/api/cogntive/emotions?answerType=COGNITIVE_AUDIO', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ emotion: (finalEmotion || 'NEUTRAL').toUpperCase() }),
            })
          } catch (e) {
            console.error('감정 전송 실패:', e)
          } finally {
            setShowCompleteModal(false)
            router.push('/main-elder/recall-training')
          }
        }}
      />
    </div>
  )
}
