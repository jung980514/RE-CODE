"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { SurveyQuestionProps } from "./types"
import { surveyQuestions } from "./surveyData"
import { ArrowLeft, Play, Check, Volume2, Clock, User, Brain, Heart, Mic, MicOff, Video, VideoOff, Download, AlertTriangle, VolumeX, Volume1, ArrowRight, CheckCircle, RotateCcw } from "lucide-react"
import { useGoogleTTS } from "@/api/googleTTS"
import { WebcamView } from "@/components/common/WebcamView"

// 음성 및 영상 녹화 훅 (recall-training 방식)
function useVoiceRecording() {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedMedia, setRecordedMedia] = useState<string | null>(null)
  const [isAutoRecording, setIsAutoRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const combinedStreamRef = useRef<MediaStream | null>(null)

  const startRecording = async (isAuto = false) => {
    try {
      // 기존 스트림 정리
      if (combinedStreamRef.current) {
        combinedStreamRef.current.getTracks().forEach((track) => track.stop())
      }
      
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const newVideoStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      })
      
      const tracks = [...audioStream.getAudioTracks(), ...newVideoStream.getVideoTracks()]
      
      const combinedStream = new MediaStream(tracks)
      combinedStreamRef.current = combinedStream

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: "video/mp4",
      })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.start()
      setIsRecording(true)
      setIsAutoRecording(isAuto)

      mediaRecorder.ondataavailable = (event) => {
        const mediaBlob = new Blob([event.data], { type: "video/mp4" })
        const mediaUrl = URL.createObjectURL(mediaBlob)
        setRecordedMedia(mediaUrl)
      }
    } catch (error) {
      console.error("녹화 오류:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsAutoRecording(false)

      // 스트림 정리
      if (combinedStreamRef.current) {
        combinedStreamRef.current.getTracks().forEach((track) => track.stop())
      }

      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }

  const resetRecording = () => {
    // 녹화 중지
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
    
    // 스트림 정리
    if (combinedStreamRef.current) {
      combinedStreamRef.current.getTracks().forEach((track) => track.stop())
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
    }

    // 기존 URL 정리
    if (recordedMedia) {
      URL.revokeObjectURL(recordedMedia)
    }

    // 상태 초기화
    setIsRecording(false)
    setIsAutoRecording(false)
    setRecordedMedia(null)
    
    // ref 초기화
    mediaRecorderRef.current = null
    audioContextRef.current = null
    combinedStreamRef.current = null
  }

  return {
    isRecording,
    recordedMedia,
    isAutoRecording,
    startRecording,
    stopRecording,
    resetRecording,
  }
}



export default function SurveyQuestion({ onComplete, onBack }: SurveyQuestionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [isTTSFinished, setIsTTSFinished] = useState(false)
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null)
  const [showNoResponseWarning, setShowNoResponseWarning] = useState(false)
  const [showRecordingComplete, setShowRecordingComplete] = useState(false)
  const [preparationMessagePlayed, setPreparationMessagePlayed] = useState(false)
  
  const router = useRouter()
  
  // TTS Hook 사용
  const { 
    state: ttsState, 
    speak: ttsSpeak, 
    stop: ttsStop, 
    isPlaying: isTTSPlaying
  } = useGoogleTTS()
  
  // 녹화 훅 사용
  const { isRecording, recordedMedia, isAutoRecording, startRecording, stopRecording, resetRecording } = useVoiceRecording()

  const currentQuestion = surveyQuestions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / surveyQuestions.length) * 100

  // 진행 상황이 있는지 확인 (첫 번째 질문이 아니거나 녹화가 있는 경우)
  const hasProgress = currentQuestionIndex > 0 || recordedMedia !== null

  // 페이지 이탈 방지 이벤트 핸들러들
  const handleKeyDown = (e: KeyboardEvent) => {
    if (hasProgress && (e.key === 'Escape' || e.key === 'Backspace')) {
      e.preventDefault()
      setShowWarningModal(true)
    }
  }

  const handlePopState = (e: PopStateEvent) => {
    if (hasProgress) {
      e.preventDefault()
      setShowWarningModal(true)
      // 브라우저 히스토리에 다시 추가
      window.history.pushState(null, '', window.location.href)
    }
  }

  // 새로고침 방지를 위한 커스텀 핸들러
  const handleRefresh = (e: KeyboardEvent) => {
    if (hasProgress && (e.key === 'F5' || (e.ctrlKey && e.key === 'r'))) {
      e.preventDefault()
      setShowWarningModal(true)
    }
  }

  // navbar 링크 클릭 감지를 위한 전역 이벤트 리스너
  const handleNavbarLinkClick = (e: MouseEvent) => {
    if (hasProgress) {
      // navbar 내의 링크나 버튼 클릭 감지
      const target = e.target as HTMLElement
      
      // navbar 관련 요소들 감지 (실제 CSS 모듈 클래스명 사용)
      const isNavbarElement = 
        target.closest('nav') || 
        target.closest('[class*="navbar"]') ||
        target.closest('[class*="logoLink"]') ||
        target.closest('[class*="authLink"]') ||
        target.closest('[class*="userNameLink"]') ||
        target.closest('[class*="userNameContainer"]') ||
        target.closest('[class*="logoContainer"]') ||
        target.closest('[class*="authLinks"]') ||
        target.closest('[class*="container"]') ||
        target.tagName === 'A' ||
        target.tagName === 'BUTTON'
      
      // navbar 영역 내의 클릭인지 확인
      const navbar = document.querySelector('nav')
      if (navbar && navbar.contains(target)) {
        e.preventDefault()
        e.stopPropagation()
        setShowWarningModal(true)
        return false
      }
    }
  }

  // Next.js 라우터 이벤트 감지를 위한 함수
  const handleRouteChange = (url: string) => {
    if (hasProgress) {
      // 현재 페이지에서 다른 페이지로 이동하려고 할 때
      if (url !== window.location.pathname) {
        setShowWarningModal(true)
        // 라우터 변경을 취소하기 위해 현재 URL로 다시 설정
        window.history.pushState(null, '', window.location.pathname)
        return false
      }
    }
  }

  // 강화된 navbar 링크 클릭 감지
  const handleEnhancedNavbarClick = (e: MouseEvent) => {
    if (hasProgress) {
      const target = e.target as HTMLElement
      
      // navbar 영역 확인
      const navbar = document.querySelector('nav')
      if (!navbar) return
      
      // 클릭된 요소가 navbar 내부인지 확인
      if (navbar.contains(target)) {
        // 링크나 버튼 요소인지 확인
        const isLink = target.closest('a')
        const isButton = target.closest('button')
        const isClickable = target.onclick !== null || target.getAttribute('role') === 'button'
        
        if (isLink || isButton || isClickable) {
          e.preventDefault()
          e.stopPropagation()
          setShowWarningModal(true)
          return false
        }
      }
    }
  }

  // Next.js Link 컴포넌트 클릭 감지를 위한 함수
  const handleLinkClick = (e: MouseEvent) => {
    if (hasProgress) {
      const target = e.target as HTMLElement
      
      // navbar 내의 모든 클릭 가능한 요소 감지
      const navbar = document.querySelector('nav')
      if (navbar && navbar.contains(target)) {
        // href 속성이 있는 링크나 클릭 가능한 요소인지 확인
        const link = target.closest('a[href]')
        const button = target.closest('button')
        const clickableElement = target.closest('[onclick], [role="button"], [tabindex]')
        
        if (link || button || clickableElement) {
          e.preventDefault()
          e.stopPropagation()
          setShowWarningModal(true)
          return false
        }
      }
    }
  }

  // 페이지 이탈 방지 이벤트 리스너 등록
  useEffect(() => {
    // 키보드 이벤트 (ESC, Backspace, F5, Ctrl+R)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keydown', handleRefresh)
    
    // 브라우저 뒤로가기/앞으로가기
    window.addEventListener('popstate', handlePopState)
    
    // navbar 링크 클릭 감지 (캡처 단계에서 처리)
    document.addEventListener('click', handleNavbarLinkClick, true)
    
    // 전역 클릭 이벤트로 링크 클릭 감지
    const handleGlobalClick = (e: MouseEvent) => {
      if (hasProgress) {
        const target = e.target as HTMLElement
        const link = target.closest('a')
        const button = target.closest('button')
        
        if (link || button) {
          const navbar = document.querySelector('nav')
          if (navbar && navbar.contains(target)) {
            e.preventDefault()
            e.stopPropagation()
            setShowWarningModal(true)
            return false
          }
        }
      }
    }
    
    document.addEventListener('click', handleGlobalClick, true)
    
    // 강화된 navbar 클릭 감지
    document.addEventListener('click', handleEnhancedNavbarClick, true)
    
    // Next.js Link 컴포넌트 클릭 감지
    document.addEventListener('click', handleLinkClick, true)
    
    // 브라우저 히스토리에 현재 상태 추가
    window.history.pushState(null, '', window.location.href)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keydown', handleRefresh)
      window.removeEventListener('popstate', handlePopState)
      document.removeEventListener('click', handleNavbarLinkClick, true)
      document.removeEventListener('click', handleGlobalClick, true)
      document.removeEventListener('click', handleEnhancedNavbarClick, true)
      document.removeEventListener('click', handleLinkClick, true)
    }
  }, [hasProgress])

  // 녹화 완료 시 안내문 표시
  useEffect(() => {
    if (recordedMedia && !isRecording) {
      setShowRecordingComplete(true)
      const timer = setTimeout(() => {
        setShowRecordingComplete(false)
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [recordedMedia, isRecording])

  const handleBackClick = () => {
    if (hasProgress) {
      setShowWarningModal(true)
    } else {
      onBack()
    }
  }

  const handleConfirmExit = () => {
    console.log('handleConfirmExit called')
    setShowWarningModal(false)
    onBack()
  }

  const handleCancelExit = () => {
    console.log('handleCancelExit called')
    setShowWarningModal(false)
  }

  // TTS 관련 함수들
  const speakQuestion = async (text: string) => {
    const result = await ttsSpeak({
      text,
      language: 'ko-KR'
    })

    if (!result.success) {
      console.error('TTS 오류:', result.error)
    }
  }

  const speakPreparationMessage = async () => {
    const preparationText = "준비가 완료되시면 수동 녹음 버튼을 눌러주세요"
    const result = await ttsSpeak({
      text: preparationText,
      language: 'ko-KR'
    })

    if (!result.success) {
      console.error('TTS 오류:', result.error)
    }
  }

  const stopTTS = () => {
    ttsStop()
  }



  // TTS 완료 감지 및 준비 메시지 후 녹화 안내
  useEffect(() => {
    if (!isTTSPlaying && isTTSFinished && !preparationMessagePlayed) {
      // TTS가 완료되면 준비 메시지를 읽고 녹화 안내 (1번만)
      const timer = setTimeout(async () => {
        await speakPreparationMessage()
        setPreparationMessagePlayed(true)
        setIsTTSFinished(false)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [isTTSPlaying, isTTSFinished, preparationMessagePlayed])

  // TTS 재생 상태 감지
  useEffect(() => {
    if (isTTSPlaying) {
      setIsTTSFinished(false)
    } else if (!isTTSPlaying && !isTTSFinished) {
      // TTS가 재생 중이 아니고 아직 완료되지 않았다면 완료로 간주
      setIsTTSFinished(true)
    }
  }, [isTTSPlaying])

  useEffect(() => {
    // 컴포넌트 마운트 시 정리
    return () => {
      // TTS 정리
      ttsStop()
    }
  }, [])

  // 질문 변경 시 TTS 실행
  useEffect(() => {
    if (currentQuestion) {
      const questionText = `${currentQuestion.title} ${currentQuestion.description}`
      speakQuestion(questionText)
    }
  }, [currentQuestionIndex])

  // 녹음 시작 시 TTS 중지
  useEffect(() => {
    if (isRecording) {
      ttsStop()
    }
  }, [isRecording])

  const handleNextQuestion = () => {
    // 응답이 없으면 경고 표시
    if (!recordedMedia && !isRecording) {
      setShowNoResponseWarning(true)
      return
    }

    if (currentQuestionIndex < surveyQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      // 다음 질문으로 넘어갈 때 녹화 상태 완전 초기화
      resetRecording()
      // 다음 질문에서 준비 메시지를 다시 재생할 수 있도록 상태 초기화
      setPreparationMessagePlayed(false)
    } else {
      // 설문 완료 시 현재 녹화 파일 다운로드
      downloadAllRecordings()
      onComplete()
    }
  }

  const downloadAllRecordings = () => {
    // 현재 녹화된 미디어 다운로드
    if (recordedMedia) {
      const a = document.createElement('a')
      a.href = recordedMedia
      a.download = `complete_survey_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const getQuestionStatus = (questionIndex: number) => {
    if (questionIndex < currentQuestionIndex) return "completed"
    if (questionIndex === currentQuestionIndex) return "current"
    return "pending"
  }

  const getQuestionIcon = (index: number) => {
    switch (index) {
      case 0: return <User className="w-5 h-5" />
      case 1: return <Brain className="w-5 h-5" />
      case 2: return <Heart className="w-5 h-5" />
      default: return <User className="w-5 h-5" />
    }
  }



  const replayQuestion = () => {
    if (currentQuestion) {
      const questionText = `${currentQuestion.title} ${currentQuestion.description}`
      speakQuestion(questionText)
    }
  }

  const handleCloseNoResponseWarning = () => {
    setShowNoResponseWarning(false)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Header Section */}
      <div className="pt-8 pb-4 px-6" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handleBackClick}
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
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentQuestion.title}
                </h2>
              </div>

              {/* Question Description */}
              <p className="text-gray-600 mb-8">
                {currentQuestion.description}
              </p>

              {/* Recording Area */}
              <div className="border border-gray-200 rounded-lg p-6 mb-6 bg-white">
                {/* 녹음 중 상태 */}
                {isRecording && (
                  <div className="mb-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          </div>
                          <div>
                            <p className="font-medium text-red-800">녹음 중입니다</p>
                            <p className="text-sm text-red-600">답변을 마치시면 정지 버튼을 눌러주세요</p>
                          </div>
                        </div>
                      </div>
                      

                    </div>
                  </div>
                )}

                {/* 녹화 완료 안내문 (2초간 표시) */}
                {showRecordingComplete && (
                  <div className="mb-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <div className="flex items-center justify-center gap-3">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <div className="text-center">
                          <p className="font-medium text-green-800">녹화가 완료되었습니다</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 녹음된 미디어 재생 */}
                {recordedMedia && !isRecording && (
                  <div className="mb-8">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-center">
                        <video controls src={recordedMedia} className="w-full max-w-md rounded-lg" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 컨트롤 버튼들 */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={replayQuestion}
                    className="flex items-center gap-2 px-4 py-2 border border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 bg-transparent transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    다시재생
                  </button>

                  <button
                    onClick={isRecording ? stopRecording : () => startRecording(false)}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                      isRecording
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-5 h-5" />
                        녹음 중지
                      </>
                    ) : (
                      <>
                        <Mic className="w-5 h-5" />
                        수동 녹음
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleNextQuestion}
                    disabled={!recordedMedia && !isRecording}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                      recordedMedia || isRecording
                        ? "bg-blue-500 hover:bg-blue-600 text-white"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {currentQuestionIndex < surveyQuestions.length - 1 ? '다음 질문' : '설문 완료'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Webcam View */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <WebcamView
                isRecording={isRecording}
                onStreamReady={setWebcamStream}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="fixed bottom-6 left-6 right-6">
        <div className="max-w-6xl mx-auto flex items-center justify-end">
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

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] backdrop-blur-sm">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-3xl shadow-2xl max-w-md w-full border-2 border-blue-200 relative overflow-hidden">
            {/* 배경 장식 */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute top-4 left-4 w-8 h-8 bg-blue-400 rounded-full animate-pulse"></div>
              <div className="absolute top-8 right-6 w-4 h-4 bg-purple-400 rounded-full animate-pulse delay-300"></div>
              <div className="absolute bottom-6 left-6 w-6 h-6 bg-pink-400 rounded-full animate-pulse delay-500"></div>
              <div className="absolute bottom-4 right-4 w-3 h-3 bg-yellow-400 rounded-full animate-pulse delay-700"></div>
            </div>

            {/* 말풍선과 캐릭터 */}
            <div className="relative mb-6">
              <div className="flex items-center justify-between">
                <div className="bg-white rounded-2xl px-6 py-4 shadow-lg relative">
                  <div className="absolute -bottom-2 left-8 w-4 h-4 bg-white transform rotate-45"></div>
                  <div className="text-gray-700 font-medium">
                    <p>정말 <span className="text-blue-600 font-bold">중단</span>하실 건가요?</p>
                    <p className="text-sm mt-1 text-gray-600">나가시면 처음부터 다시 응답해야 합니다</p>
                  </div>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-orange-300 to-red-400 rounded-full flex items-center justify-center shadow-lg relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-200 to-red-300 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🍄</span>
                  </div>
                  {/* 반짝이는 효과 */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full animate-pulse"></div>
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-yellow-300 rounded-full animate-pulse delay-300"></div>
                </div>
              </div>
            </div>

            {/* 정보 패널들 */}
            <div className="space-y-4 mb-6">
              {/* 상단 패널 - 진행 상황 */}
              <div className="bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl p-4 text-white shadow-lg">
                <div className="flex justify-between items-center">
                  <div className="text-center">
                    <p className="text-xs opacity-80 mb-1">진행률</p>
                    <p className="text-2xl font-bold">{Math.round(progress)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs opacity-80 mb-1">질문</p>
                    <p className="text-2xl font-bold">{currentQuestionIndex + 1}/{surveyQuestions.length}</p>
                  </div>
                </div>
              </div>

              {/* 하단 패널 - 경고 메시지 */}
              <div className="bg-gradient-to-r from-orange-400 to-red-500 rounded-xl p-4 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 bg-yellow-300 rounded-full flex items-center justify-center">
                    <span className="text-yellow-800 text-sm font-bold">!</span>
                  </div>
                  <p className="font-medium">
                    아직 <span className="text-yellow-300 font-bold">완료하지 않은</span> 질문이 있어요!
                  </p>
                </div>
                <div className="space-y-2 text-sm opacity-90">
                  {/* 현재 질문이 완료되지 않은 경우 */}
                  {currentQuestionIndex < surveyQuestions.length && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
                      <p>• {surveyQuestions[currentQuestionIndex].title}</p>
                    </div>
                  )}
                  {/* 남은 질문들 */}
                  {surveyQuestions.slice(currentQuestionIndex + 1).map((question, index) => (
                    <div key={question.id} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
                      <p>• {question.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="flex gap-4 relative z-10">
              <button
                onClick={() => {
                  console.log('예 버튼 클릭됨')
                  handleConfirmExit()
                }}
                className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-gray-400 to-gray-500 text-white font-medium shadow-lg hover:from-gray-500 hover:to-gray-600 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                예
              </button>
              <button
                onClick={() => {
                  console.log('아니오 버튼 클릭됨')
                  handleCancelExit()
                }}
                className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-green-400 to-green-500 text-white font-medium shadow-lg hover:from-green-500 hover:to-green-600 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                아니오
              </button>
            </div>

            {/* 추가 장식 요소 */}
            <div className="absolute top-2 right-2 w-2 h-2 bg-blue-300 rounded-full animate-ping"></div>
            <div className="absolute bottom-2 left-2 w-1 h-1 bg-purple-300 rounded-full animate-ping delay-500"></div>
          </div>
        </div>
      )}

      {/* 응답 없음 경고 모달 */}
      {showNoResponseWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="w-12 h-12 text-orange-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">응답이 필요합니다</h3>
            <p className="text-gray-700 mb-4">
              다음 질문으로 넘어가려면 해당 질문에 대한 응답을 완료해주세요.
              <br />
              녹음 버튼을 눌러 답변을 녹화해주세요.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCloseNoResponseWarning}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  )
} 