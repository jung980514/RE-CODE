"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RotateCcw, Mic, ChevronRight, Camera, MessageCircleQuestionMark } from "lucide-react"
import { synthesizeSpeech, playAudio, stopCurrentAudio } from "@/api/googleTTS/googleTTSService"
import TrainingCompleteModal from "@/app/main-elder/recall-training/components/TrainingCompleteModal"
import { useRouter } from "next/navigation"
import { markRecallTrainingSessionAsCompleted } from "@/lib/auth"

// 감정 분석 타입 및 훅
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
  detectEnabled: boolean,
  onSecondSample?: (sample: { timestamp: number; emotion: string; confidence: number }) => void,
) {
  const faceapiRef = useRef<FaceApiModule | null>(null)
  const [emotion, setEmotion] = useState<string>('중립')
  const [confidence, setConfidence] = useState<number>(0)
  const requestRef = useRef<number | undefined>(undefined)
  const modelsLoaded = useRef<boolean>(false)
  const prevExpressions = useRef<FaceExpressions | null>(null)
  const lastRecordTime = useRef<number>(0)

  useEffect(() => {
    const loadModels = async () => {
      try {
        if (!faceapiRef.current) {
          const faceModule = (await import('@vladmandic/face-api')) as unknown as FaceApiModule
          faceapiRef.current = faceModule
        }
        await Promise.all([
          faceapiRef.current.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'),
          faceapiRef.current.nets.faceExpressionNet.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model')
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
    if (!modelsLoaded.current || !videoRef.current || !faceapiRef.current) return

    try {
      const detections = await faceapiRef.current
        .detectSingleFace(videoRef.current, new faceapiRef.current.TinyFaceDetectorOptions())
        .withFaceExpressions()

      if (detections) {
        const expressions = detections.expressions as FaceExpressions

        const emotionChange = prevExpressions.current ?
          Math.abs(expressions.neutral - prevExpressions.current.neutral) : 0

        const isSpeaking = emotionChange > 0.15
        const isSmiling = expressions.happy > 0.3
        const isNeutralDominant = expressions.neutral > 0.5

        const sadScore = expressions.sad
        const mouthOpenScore = Math.max(expressions.surprised, expressions.sad)
        const isMouthOpen = mouthOpenScore > 0.3

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

          const now = Date.now()
          if (now - lastRecordTime.current >= 1000) {
            if (typeof onSecondSample === 'function') {
              onSecondSample({ timestamp: now, emotion: newEmotion, confidence: maxConfidence })
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
    if (videoRef.current && videoRef.current.videoWidth > 0 && detectEnabled) {
      detectEmotion()
    } else {
      setEmotion('중립')
      setConfidence(0)
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [videoRef.current?.videoWidth, detectEnabled])

  return { emotion, confidence }
}

export function VoicePhotoReminiscenceSession({ onBack }: { onBack: () => void }) {
  const router = useRouter()
  const [isRecording, setIsRecording] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(true)
  const [cameraError, setCameraError] = useState(false)
  const [questions, setQuestions] = useState<Array<{ questionId: number; content: string; mediaUrl: string; mediaType: string; createdAt: string }>>([])
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [questionsLoading, setQuestionsLoading] = useState<boolean>(false)
  const [questionsError, setQuestionsError] = useState<string | null>(null)
  const recordedBlobRef = useRef<Blob | null>(null)
  const selectedMimeTypeRef = useRef<string>('video/mp4')
  const selectedExtensionRef = useRef<string>('mp4')
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [hasRecorded, setHasRecorded] = useState<boolean>(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // 감정 분석 훅 사용
  // 세션 감정 기록 (1초 단위)
  const sessionEmotionHistory = useRef<Array<{ timestamp: number; emotion: string; confidence: number }>>([])
  const [sessionActive, setSessionActive] = useState<boolean>(false)
  const [showCompleteModal, setShowCompleteModal] = useState<boolean>(false)
  const [finalEmotion, setFinalEmotion] = useState<string>('NEUTRAL')
  
  // GIF 이미지 관련 상태
  const [isSpeaking, setIsSpeaking] = useState(false)
  const audioContextGifRef = useRef<AudioContext | null>(null)
  const analyserGifRef = useRef<AnalyserNode | null>(null)
  const micStreamGifRef = useRef<MediaStream | null>(null)
  const rafGifRef = useRef<number | null>(null)
  const lastAboveThresholdMsGifRef = useRef<number>(0)
  
  // 말풍선 이미지 상태
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

  const { emotion, confidence } = useEmotionDetection(
    videoRef,
    sessionActive,
    (sample) => {
      sessionEmotionHistory.current.push(sample)
    }
  )

  useEffect(() => {
    initializeCamera()
    const fetchQuestions = async () => {
      try {
        setQuestionsLoading(true)
        setQuestionsError(null)
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/cognitive/questions/image`, {
          method: 'GET',
          credentials: 'include',
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        const list: Array<{ questionId: number; content: string; mediaUrl: string; mediaType: string; createdAt: string }> =
          Array.isArray(json?.data) ? json.data : []
        setQuestions(list)
        setCurrentIndex(0)
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
        setHasRecorded(true)
      }

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event)
      }

      mediaRecorder.start(1000)
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      setSessionActive(true)
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

  // 질문 TTS 재생
  const replayQuestionTTS = async () => {
    try {
      if (questions.length === 0) return
      stopCurrentAudio()
      const text = `${questions[currentIndex]?.content}\n준비되시면 대답하기 버튼을 눌러 시작해주세요.`
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
        const text = `${questions[currentIndex]?.content}\n준비되시면 대답하기 버튼을 눌러 시작해주세요.`
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
  }, [questionsLoading, currentIndex, questions.length])

  // 현재 질문 답변 업로드 후 다음으로 이동
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
      formData.append('mediaType', 'image')
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

  const handleNext = async () => {
    if (questions.length === 0) return
    stopCurrentAudio()
    if (isRecording) {
      stopRecording()
    }
    const isLast = currentIndex === (questions.length - 1)
    // 현재 감정 로그 출력 (VoiceMemoryTrainingSession와 유사하게 상태 기록 노출)
    try {
      console.log(`[다음으로] 현재 감정: ${emotion}, 신뢰도: ${confidence}%`)
    } catch {}
    await uploadCurrentAnswer()

    if (isLast) {
      // 세션 감정 요약 계산 (전송은 모달에서 수행)
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
          console.log(`[세션 감정 요약] 총 ${totalDurationSec}s, 임계 ${thresholdSec}s, 최종 감정: ${emotionCode}`)
          setFinalEmotion(emotionCode)
          // 기록 초기화 (다음 세션 대비)
          sessionEmotionHistory.current = []
        } else {
          setFinalEmotion('NEUTRAL')
        }
      } catch (e) {
        console.error('세션 감정 요약 계산 오류:', e)
        setFinalEmotion('NEUTRAL')
      }
      // 포토 세션 완료 플래그 저장
      markRecallTrainingSessionAsCompleted('photo')
      setShowCompleteModal(true)
      return
    }

    setCurrentIndex((prev) => (prev + 1) % questions.length)
    setHasRecorded(false)
  }

  const resolveMediaUrl = (rawUrl: string): string => {
    if (!rawUrl) return ''
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl

    // 사용자 제안 로직 기반: 기본 리전 ap-northeast-2 강제
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

  const getEmotionColor = (emotionLabel: string) => {
    switch (emotionLabel) {
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

  const getEmotionProgressColor = (emotionLabel: string) => {
    switch (emotionLabel) {
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
    <div className="bg-gray-50 p-1 md:p-2 relative">


      {/* Header */}
      <div className="max-w-6xl mx-auto mb-1">
        <div>
          <h1 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Pretendard' }}>추억의 시대 훈련</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-2">
        {/* Left Panel - Photo Exercise */}
        <Card className="lg:col-span-2 p-2 bg-white shadow-lg">
          <div className="text-center mb-2">
            <div className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-full text- font-medium mb-1" style={{ fontFamily: 'Pretendard' }}>
              <MessageCircleQuestionMark className="w-3 h-3" />
              사진 {questions.length > 0 ? currentIndex + 1 : 0}/{questions.length}
            </div>
          </div>

          {/* Photo Display */}
          <div className="relative bg-gray-200 rounded-xl overflow-hidden mb-2" style={{ aspectRatio: "16/9" }}>
            {questionsLoading ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm" style={{ fontFamily: 'Pretendard' }}>불러오는 중...</div>
            ) : questionsError ? (
              <div className="absolute inset-0 flex items-center justify-center text-red-600 text-sm" style={{ fontFamily: 'Pretendard' }}>{questionsError}</div>
            ) : questions.length > 0 ? (
              <img
                src={resolveMediaUrl(questions[currentIndex].mediaUrl)}
                alt={questions[currentIndex].content}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement
                  el.src = '/images/reminiscence.jpg'
                }}
              />
            ) : (
              <img src="/images/reminiscence.jpg" alt="기억 사진" className="w-full h-full object-cover" />
            )}
          </div>

          {/* Question */}
          <div className="mb-1">
            <div className="flex items-start gap-2">
              <div>
                {questionsLoading ? (
                  <p className="text-gray-600 text-sm" style={{ fontFamily: 'Pretendard' }}>질문을 불러오는 중입니다...</p>
                ) : questionsError ? (
                  <p className="text-red-600 text-sm" style={{ fontFamily: 'Pretendard' }}>{questionsError}</p>
                ) : questions.length > 0 ? (
                  <div>
                    <p className="text-gray-700 leading-relaxed text-3xl mb-2" style={{ fontFamily: 'Paperlogy' }}>
                      {questions[currentIndex].content}
                    </p>
                    <p className="text-gray-700 leading-relaxed text-xl" style={{ fontFamily: 'Pretendard'}}>
                      준비가 완료되면 <strong className="text-purple-600">대답하기</strong> 버튼을 눌러 대답해주세요
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm" style={{ fontFamily: 'Pretendard' }}>표시할 질문이 없습니다.</p>
                )}
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={replayQuestionTTS}
              className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50 bg-transparent h-12 text-base text-2xl"
              style={{ fontFamily: 'Pretendard' }}
            >
              다시재생
            </Button>

            <Button
              className={`flex-1 h-12 text-base text-2xl ${isRecording ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}`}
              onClick={handleAnswerClick}
              style={{ fontFamily: 'Pretendard' }}
            >
              {isRecording ? "녹화중지" : "대답하기"}
            </Button>

            <Button 
              className={`flex-1 h-12 text-base text-white disabled:opacity-60 disabled:cursor-not-allowed text-2xl min-w-[120px] flex items-center justify-center gap-2 ${
                isUploading 
                  ? 'bg-purple-400 cursor-wait' 
                  : 'bg-purple-500 hover:bg-purple-600'
              }`} 
              onClick={handleNext} 
              disabled={questions.length === 0 || isRecording || !hasRecorded || isUploading} 
              style={{ fontFamily: 'Pretendard' }}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>로딩 중</span>
                </>
              ) : (
                questions.length > 0 && currentIndex === questions.length - 1 ? '완료하기' : '다음 사진'
              )}
            </Button>
          </div>
        </Card>

        {/* Right Panel - Webcam */}
        <Card className="lg:col-span-1 p-2 bg-white shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-1 text-center" style={{ fontFamily: 'Pretendard' }}>내 화면</h3>

          {/* Webcam Display */}
          <div className="relative bg-gray-900 rounded-xl overflow-hidden mb-2" style={{ aspectRatio: "4/3" }}>
            {cameraLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                <Camera className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs" style={{ fontFamily: 'Pretendard' }}>카메라를 불러오는 중...</p>
              </div>
            )}

            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                <Camera className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs" style={{ fontFamily: 'Pretendard' }}>카메라 접근 실패</p>
                <Button variant="outline" size="sm" className="mt-1 bg-transparent text-xs h-6" onClick={initializeCamera} style={{ fontFamily: 'Pretendard' }}>
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
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs" style={{ fontFamily: 'Pretendard' }}>
                <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                녹화중
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-lg" style={{ fontFamily: 'Pretendard' }}>현재 감정:</span>
              <span className={`font-medium text-lg ${getEmotionColor(emotion)} flex items-center gap-1`} style={{ fontFamily: 'Pretendard' }}>
                {emotion}
              </span>
            </div>
          </div>

          {/* GIF Image Area */}
          <div className="flex-1">
            <div className="h-full bg-white rounded-2xl overflow-visible relative min-h-[300px]">
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
            await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/cognitive/emotions?answerType=COGNITIVE_IMAGE`, {
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
