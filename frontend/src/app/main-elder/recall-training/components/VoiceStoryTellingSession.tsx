"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, RotateCcw, Mic, ChevronRight, Camera, Star, BookOpen } from "lucide-react"

interface VoiceSessionProps {
  onBack: () => void
}

export function VoiceStoryTellingSession({ onBack }: VoiceSessionProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(true)
  const [cameraError, setCameraError] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

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

        setTimeout(() => {
          const blob = new Blob(chunks, { type: mimeType })
          console.log("Final blob size:", blob.size, "bytes, type:", blob.type)

          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = `recording-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.${fileExtension}`

          link.style.display = "none"
          document.body.appendChild(link)
          link.click()

          setTimeout(() => {
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
          }, 100)
        }, 100)
      }

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event)
      }

      mediaRecorder.start(100)
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      console.log("Recording started with format:", mimeType)
    } catch (error) {
      console.error("Recording failed:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.requestData()
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-2 md:p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-4">
        <div className="flex items-center gap-4 mb-3">
          <Button variant="ghost" size="sm" className="text-gray-600" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-1">이야기 나누기 훈련</h1>
          <p className="text-gray-600">개인화된 실증 질문으로 소중한 추억을 되살려보세요</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-4">
        {/* Left Panel - Question Exercise */}
        <Card className="p-4 bg-white shadow-lg">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-3">
              <BookOpen className="w-4 h-4" />
              주제 1/0
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">개인화 질문</h2>
          </div>

          {/* Question */}
          <div className="mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-orange-600 mb-2">질문을 읽어주세요</h3>
                <p className="text-gray-700 leading-relaxed">질문을 불러오는 중입니다...</p>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-orange-200 text-orange-700 hover:bg-orange-50 bg-transparent"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              다시재생
            </Button>

            <Button
              className={`flex-1 ${isRecording ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}`}
              onClick={handleAnswerClick}
            >
              <Mic className="w-4 h-4 mr-2" />
              {isRecording ? "녹화중지" : "답변하기"}
            </Button>

            <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
              다음 주제
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>

        {/* Right Panel - Webcam */}
        <Card className="p-4 bg-white shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">시상당사</h3>

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

            <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded text-sm">
              영상시작/재시도
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-800">감정 분석</h4>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">현재 감정:</span>
              <span className="text-orange-600 font-medium">중립</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">신뢰도:</span>
              <span className="text-orange-600 font-medium">0%</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default VoiceStoryTellingSession
