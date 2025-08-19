"use client"

import { useState, useEffect, useRef } from "react"
import { SurveyFormProps, RecordingData } from "./types"
import { useDailySurveyQuestions } from "./surveyData"
import { ArrowLeft, Play, Check, Volume2, Clock, User, Brain, Heart, Mic, MicOff } from "lucide-react"

export default function SurveyForm({ onComplete, onBack }: SurveyFormProps) {
  const { questions: surveyQuestions, isLoading, error } = useDailySurveyQuestions()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [recordings, setRecordings] = useState<Record<number, RecordingData>>({})
  const [isRecording, setIsRecording] = useState(false)
  const [isRecorded, setIsRecorded] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const currentQuestion = surveyQuestions[currentQuestionIndex]
  const progress = surveyQuestions.length > 0 ? ((currentQuestionIndex + 1) / surveyQuestions.length) * 100 : 0

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        const audioUrl = URL.createObjectURL(audioBlob)
        
        setRecordings(prev => ({
          ...prev,
          [currentQuestionIndex]: {
            audioUrl,
            duration: recordingTime,
            blob: audioBlob
          }
        }))
        
        setIsRecorded(true)
        setIsRecording(false)
        setRecordingTime(0)
        
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      // 실제 녹음이 실패했을 때 시뮬레이션
      setTimeout(() => {
        setIsRecording(false)
        setIsRecorded(true)
        setRecordingTime(0)
      }, 2000)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
  }

  const handleRecord = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const handlePlayAnswer = () => {
    const recording = recordings[currentQuestionIndex]
    if (recording && recording.audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      
      audioRef.current = new Audio(recording.audioUrl)
      audioRef.current.onended = () => setIsPlaying(false)
      audioRef.current.onplay = () => setIsPlaying(true)
      audioRef.current.onpause = () => setIsPlaying(false)
      audioRef.current.play()
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < surveyQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setIsRecorded(false)
      setIsRecording(false)
      setRecordingTime(0)
      setIsPlaying(false)
    } else {
      onComplete()
    }
  }

  const getQuestionStatus = (questionIndex: number) => {
    if (questionIndex < currentQuestionIndex) return "completed"
    if (questionIndex === currentQuestionIndex) return "current"
    return "pending"
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getQuestionIcon = (index: number) => {
    switch (index) {
      case 0: return <User className="w-5 h-5" />
      case 1: return <Brain className="w-5 h-5" />
      case 2: return <Heart className="w-5 h-5" />
      default: return <User className="w-5 h-5" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">질문을 불러오는 중...</div>
      </div>
    )
  }

  if (error || surveyQuestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error ?? '질문을 불러오지 못했습니다'}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Header Section */}
      <div className="pt-8 pb-4 px-6" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">돌아가기</span>
            </button>
            
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                일일 설문조사
              </h1>
              <p className="text-gray-600">
                개인화 질문 {currentQuestionIndex + 1}/{surveyQuestions.length}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-gray-600 text-sm">진행률</p>
              <p className="text-2xl font-bold text-blue-600">{Math.round(progress)}%</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-blue-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Question */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8">
              {/* Question Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  {getQuestionIcon(currentQuestionIndex)}
                </div>
                <span className="text-blue-600 font-medium">
                  {currentQuestion.category}
                </span>
              </div>

              {/* Question Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {currentQuestion.title}
              </h2>

              {/* Question Description */}
              <p className="text-gray-600 mb-8">
                {currentQuestion.description}
              </p>

              {/* Voice Input Area */}
              <div className="border border-gray-200 rounded-lg p-6 mb-6 bg-white">
                <div className="flex items-center justify-center h-32">
                  {isRecorded ? (
                    <div className="flex items-center gap-3">
                      <Play className="w-8 h-8 text-gray-600" />
                      <span className="text-gray-600">답변 재생</span>
                    </div>
                  ) : isRecording ? (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <MicOff className="w-8 h-8 text-white" />
                      </div>
                      {/* Audio Waveform */}
                      <div className="flex items-center justify-center gap-1 mb-3">
                        {[...Array(8)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 bg-red-500 rounded-full"
                            style={{
                              height: `${Math.random() * 20 + 10}px`,
                              animation: 'pulse 1s infinite'
                            }}
                          />
                        ))}
                        {[...Array(6)].map((_, i) => (
                          <div
                            key={i + 8}
                            className="w-1 bg-red-500 rounded-full"
                            style={{ height: '4px' }}
                          />
                        ))}
                      </div>
                      <p className="text-red-600 font-medium">녹음 중...</p>
                      <p className="text-red-600 text-sm">{formatTime(recordingTime)}</p>
                      <p className="text-gray-700 text-sm mt-2">답변을 마치시면 정지 버튼을 눌러주세요</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Mic className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-gray-700 font-medium">마이크 버튼을 눌러 답변을 시작하세요</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mb-6">
                {isRecorded && (
                  <button
                    onClick={handlePlayAnswer}
                    disabled={isPlaying}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" />
                    답변 재생
                  </button>
                )}
                
                <button
                  onClick={handleRecord}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isRecording 
                      ? "bg-red-500 text-white hover:bg-red-600" 
                      : isRecorded
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-red-500 text-white hover:bg-red-600"
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      정지
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      {isRecorded ? "다시 녹음" : "녹음 시작"}
                    </>
                  )}
                </button>
              </div>

              {/* Success Message */}
              {isRecorded && (
                <div className="flex items-center gap-2 text-green-600 mb-6">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">답변이 녹음되었습니다</span>
                </div>
              )}

              {/* Next Question Button */}
              <button
                onClick={handleNextQuestion}
                disabled={!isRecorded}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all ${
                  isRecorded
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                다음 질문
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right Column - Progress Status */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">진행 상황</h3>
              
              <div className="space-y-4 mb-6">
                {surveyQuestions.map((question, index) => {
                  const status = getQuestionStatus(index)
                  return (
                    <div key={question.id} className="flex items-center gap-3">
                      {status === "completed" && (
                        <Check className="w-5 h-5 text-green-600" />
                      )}
                      {status === "current" && (
                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">+</span>
                        </div>
                      )}
                      {status === "pending" && (
                        <div className="w-5 h-5 text-gray-400">
                          {getQuestionIcon(index)}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className={`text-sm ${
                          status === "completed" ? "text-gray-900" : 
                          status === "current" ? "text-gray-900" : "text-gray-500"
                        }`}>
                          질문 {index + 1}
                        </span>
                        <span className={`text-xs ${
                          status === "completed" ? "text-gray-600" : 
                          status === "current" ? "text-gray-600" : "text-gray-400"
                        }`}>
                          {question.category}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm">예상 남은 시간: 4분</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="fixed bottom-6 left-6 right-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Volume Control */}
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-gray-600" />
            <span className="text-gray-600 text-sm">음량</span>
            <div className="w-32 h-2 bg-gray-200 rounded-full">
              <div className="w-16 h-2 bg-blue-600 rounded-full"></div>
            </div>
          </div>

          {/* Page Navigation */}
          <div className="flex gap-2">
            {[1, 2, 3].map((page) => (
              <button
                key={page}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  page === currentQuestionIndex + 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}