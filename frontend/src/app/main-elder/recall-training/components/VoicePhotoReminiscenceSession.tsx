"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, RotateCcw, Mic, ChevronRight, Camera, Home } from "lucide-react"

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

function useEmotionDetection(videoRef: React.RefObject<HTMLVideoElement | null>) {
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
    if (videoRef.current && videoRef.current.videoWidth > 0) detectEmotion()
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [videoRef.current?.videoWidth])

  return { emotion, confidence }
}

export function VoicePhotoReminiscenceSession({ onBack }: { onBack: () => void }) {
  const [isRecording, setIsRecording] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(true)
  const [cameraError, setCameraError] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // 감정 분석 훅 사용
  const { emotion, confidence } = useEmotionDetection(videoRef)

  useEffect(() => {
    initializeCamera()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
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

        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `recording-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.${fileExtension}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event)
      }

      mediaRecorder.start(1000)
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      console.log("Recording started with format:", mimeType)
    } catch (error) {
      console.error("Recording failed:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleAnswerClick = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
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

  const getEmotionEmoji = (emotionLabel: string) => {
    switch (emotionLabel) {
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
    <div className="bg-gray-50 p-2 md:p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-4">
        <div className="flex items-center gap-4 mb-3">
          <Button variant="ghost" size="sm" className="text-gray-600" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-1">추억의 시대 훈련</h1>
          <p className="text-gray-600">사진과 함께 소중한 추억을 되살려보세요</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-4">
        {/* Left Panel - Photo Exercise */}
        <Card className="p-4 bg-white shadow-lg">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-3">
              <Home className="w-4 h-4" />
              사진 1/3
            </div>
          </div>

          {/* Photo Display */}
          <div className="relative bg-gray-200 rounded-2xl overflow-hidden mb-4" style={{ aspectRatio: "4/3" }}>
            <img
              src="/placeholder.svg?height=400&width=600"
              alt="1970년대 명동거리"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 right-4 bg-purple-500 text-white px-3 py-1 rounded text-sm font-medium">
              1970년대
            </div>
          </div>

          {/* Question */}
          <div className="mb-4">
            <div className="flex items-start gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">💭</span>
              </div>
              <div>
                <h3 className="font-semibold text-purple-600 mb-1">질문을 읽어보세요</h3>
                <p className="text-gray-700 leading-relaxed">
                  이 1970년대 명동거리 사진을 보시면서 떠오르는 기억을 말씀해 주세요.
                  <br />
                  준비가 완료되면 대답하기 버튼을 눌러 대답해주세요
                </p>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50 bg-transparent"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              다시재생
            </Button>

            <Button
              className={`flex-1 ${isRecording ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}`}
              onClick={handleAnswerClick}
            >
              <Mic className="w-4 h-4 mr-2" />
              {isRecording ? "녹화중지" : "대답하기"}
            </Button>

            <Button className="flex-1 bg-purple-500 hover:bg-purple-600 text-white">
              다음 사진
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>

        {/* Right Panel - Webcam */}
        <Card className="p-4 bg-white shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">내 화면(강수정)</h3>

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
          <div className="space-y-2">
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
    </div>
  )
}
