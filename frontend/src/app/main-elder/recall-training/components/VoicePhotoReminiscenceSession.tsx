"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { WebcamView } from "@/components/common/WebcamView"
import {
  ArrowLeft,
  ArrowRight,
  Mic,
  MicOff,
  CheckCircle,
  Maximize,
  Camera,
  RotateCcw,
} from "lucide-react"
import { markRecallTrainingSessionAsCompleted } from "@/lib/auth"

interface VoiceSessionProps {
  onBack: () => void
}

// 음성 녹음 훅 (기존과 동일)
function useVoiceRecording() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null)
  const [isAutoRecording, setIsAutoRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  const startRecording = async (isAuto = false) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(stream)
      microphone.connect(analyser)
      audioContextRef.current = audioContext

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      const updateAudioLevel = () => {
        if (isRecording) {
          analyser.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          setAudioLevel(average)
          requestAnimationFrame(updateAudioLevel)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setIsAutoRecording(isAuto)
      updateAudioLevel()

      mediaRecorder.ondataavailable = (event) => {
        const audioBlob = new Blob([event.data], { type: "audio/wav" })
        const audioUrl = URL.createObjectURL(audioBlob)
        setRecordedAudio(audioUrl)
      }
    } catch (error) {
      console.error("음성 녹음 오류:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsAutoRecording(false)
      setAudioLevel(0)

      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())

      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }

  return {
    isRecording,
    audioLevel,
    recordedAudio,
    isAutoRecording,
    startRecording,
    stopRecording,
  }
}

// 자동 녹음 시작 함수
function useAutoRecording(startRecording: (isAuto: boolean) => void) {
  const [showCountdown, setShowCountdown] = useState(false)
  const [countdown, setCountdown] = useState(3)

  const startAutoRecording = () => {
    setShowCountdown(true)
    setCountdown(3)

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          setShowCountdown(false)
          startRecording(true)
          return 3
        }
        return prev - 1
      })
    }, 1000)
  }

  return { showCountdown, countdown, startAutoRecording }
}

export function VoicePhotoReminiscenceSession({ onBack }: VoiceSessionProps) {
  const [currentPhoto, setCurrentPhoto] = useState(0)
  const [isAITalking, setIsAITalking] = useState(true)
  const [volume, setVolume] = useState(80)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const { isRecording, audioLevel, recordedAudio, isAutoRecording, startRecording, stopRecording } = useVoiceRecording()
  const { showCountdown, countdown, startAutoRecording } = useAutoRecording(startRecording)

  const photos = [
    {
      src: "/placeholder.svg?height=400&width=600&text=1970년대+서울+명동거리",
      title: "1970년대 명동거리",
      question:
        "이 1970년대 명동거리 사진을 보시면서 떠오르는 기억을 말씀해 주세요.\n그 시절 거리의 모습이나 사람들의 옷차림은 어떠셨나요?",
      era: "1970년대",
    },
    {
      src: "/placeholder.svg?height=400&width=600&text=1960년대+시장+풍경",
      title: "1960년대 전통시장",
      question:
        "이런 전통시장에서 장을 보신 기억이 있으신가요?\n어떤 물건들을 사셨는지, 시장의 분위기는 어땠는지 들려주세요.",
      era: "1960년대",
    },
    {
      src: "/placeholder.svg?height=400&width=600&text=1980년대+가족+나들이",
      title: "1980년대 가족 나들이",
      question:
        "이런 가족 나들이를 하신 추억이 있으신가요?\n가족들과 어디로 놀러 가셨는지, 그때의 기분을 말씀해 주세요.",
      era: "1980년대",
    },
  ]

  const progress = ((currentPhoto + 1) / photos.length) * 100

  useEffect(() => {
    if (isAITalking) {
      const timer = setTimeout(() => {
        setIsAITalking(false)
        setTimeout(() => {
          startAutoRecording()
        }, 500)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [currentPhoto, isAITalking])

  const handleNext = () => {
    if (currentPhoto < photos.length - 1) {
      setCurrentPhoto(currentPhoto + 1)
      setIsAITalking(true)
      if (isRecording) {
        stopRecording()
      }
    } else {
      // 마지막 질문 완료 시
      markRecallTrainingSessionAsCompleted('photo')
      setShowCompletionModal(true)
    }
  }

  const handleBackToMain = () => {
    onBack()
  }

  const replayQuestion = () => {
    setIsAITalking(true)
    if (isRecording) {
      stopRecording()
    }
  }

  // 완료 모달
  if (showCompletionModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-white/95 backdrop-blur border-0 shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">추억의 시대 완료!</h2>
            <p className="text-gray-600 mb-8">
              모든 사진을 성공적으로 완료하셨습니다.<br />
              다른 훈련 프로그램도 진행해보세요.
            </p>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={handleBackToMain}
                className="flex-1"
              >
                메인으로 돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 text-lg">
            <ArrowLeft className="w-5 h-5" />
            돌아가기
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">LIVE</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">추억의 시대 훈련</h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">진행률</p>
            <p className="text-lg font-semibold text-purple-600">{Math.round(progress)}%</p>
          </div>
        </div>

        <Progress value={progress} className="mb-6 h-2" />

        {/* 메인 콘텐츠 */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* 왼쪽: 사진과 질문 영역 */}
          <div className="lg:col-span-2">
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur overflow-hidden h-full">
              <CardContent className="p-8">
                {/* 사진 제목 */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-3 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-4">
                    <Camera className="w-5 h-5" />
                    <span className="font-medium">
                      사진 {currentPhoto + 1}/{photos.length}
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">{photos[currentPhoto].title}</h2>
                  <p className="text-lg text-purple-600 font-medium">{photos[currentPhoto].era}</p>
                </div>

                {/* 사진 표시 */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl mb-6">
                  <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                    <img
                      src={photos[currentPhoto].src}
                      alt={photos[currentPhoto].title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-purple-600 font-medium">{photos[currentPhoto].era}</p>
                  </div>
                </div>

                {/* 질문 내용 */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-8 rounded-2xl mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-purple-600 font-medium mb-2">질문을 읽어주세요</p>
                      <p className="text-xl leading-relaxed text-gray-800 whitespace-pre-line">
                        {photos[currentPhoto].question}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 카운트다운 */}
                {showCountdown && (
                  <div className="text-center mb-8">
                    <div className="text-6xl font-bold text-purple-500 mb-4">{countdown}</div>
                    <p className="text-gray-600">곧 녹음이 시작됩니다...</p>
                  </div>
                )}

                {/* 녹음 상태 */}
                {isRecording && (
                  <div className="mb-8">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                          <div>
                            <p className="font-medium text-red-800">녹음 중...</p>
                            <p className="text-sm text-red-600">자유롭게 말씀해 주세요</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                      
                      {/* 오디오 레벨 표시 */}
                      <div className="mt-4">
                        <div className="flex items-center gap-1 h-8">
                          {Array.from({ length: 20 }, (_, i) => (
                            <div
                              key={i}
                              className="flex-1 bg-red-200 rounded-sm transition-all duration-100"
                              style={{
                                height: `${Math.max(10, (audioLevel / 255) * 100 * (i + 1) / 20)}%`,
                                backgroundColor: audioLevel > 50 ? '#ef4444' : '#fecaca'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 녹음된 오디오 재생 */}
                {recordedAudio && !isRecording && (
                  <div className="mb-8">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                          <div>
                            <p className="font-medium text-green-800">답변이 녹음되었습니다</p>
                            <p className="text-sm text-green-600">아래에서 다시 들어보실 수 있습니다</p>
                          </div>
                        </div>
                        <audio controls src={recordedAudio} className="h-10" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 컨트롤 버튼들 */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    onClick={replayQuestion}
                    variant="outline"
                    className="h-12 px-6 border-purple-300 text-purple-600 hover:bg-purple-50 bg-transparent"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    다시재생
                  </Button>

                  <Button
                    onClick={isRecording ? stopRecording : () => startRecording(false)}
                    className={`h-12 px-8 font-medium ${
                      isRecording
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-5 h-5 mr-2" />
                        녹음 중지
                      </>
                    ) : (
                      <>
                        <Mic className="w-5 h-5 mr-2" />
                        수동 녹음
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleNext}
                    disabled={!recordedAudio && !isRecording}
                    className="h-12 px-6 bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    {currentPhoto === photos.length - 1 ? '완료하기' : '다음 사진'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽: 사용자 캠 화면 */}
          <div className="lg:col-span-1">
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur overflow-hidden h-full">
              <CardContent className="p-6">
                <WebcamView 
                  userName="김싸피"
                  volume={volume}
                  onVolumeChange={setVolume}
                  isRecording={isRecording}
                />

                {/* 전체화면 버튼 */}
                <Button variant="outline" className="w-full mt-4 bg-transparent">
                  <Maximize className="w-4 h-4 mr-2" />
                  전체화면
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 진행 단계 표시 */}
        <div className="mt-8 flex justify-center gap-4">
          {photos.map((_, index) => (
            <div
              key={index}
              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                index === currentPhoto
                  ? "bg-purple-500 text-white shadow-lg scale-110"
                  : index < currentPhoto
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
              }`}
            >
              {index < currentPhoto ? <CheckCircle className="w-6 h-6" /> : index + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 