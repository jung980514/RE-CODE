"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import { SurveyQuestionProps } from "./types"
import { surveyQuestions } from "./surveyData"
import { ArrowLeft, Play, Check, Volume2, Clock, User, Brain, Heart, Mic, MicOff, Video, VideoOff, Download, AlertTriangle, VolumeX, Volume1, ArrowRight, CheckCircle, RotateCcw } from "lucide-react"
import { useGoogleTTS } from "@/api/googleTTS"
import { WebcamView } from "@/components/common/WebcamView"
import { setupTTSLeaveDetection, forceStopAllAudio, muteAllAudio } from "@/utils/ttsCleanup"

// 음성 및 영상 녹화 훅 (프리뷰 비디오 스트림 공유)
function useVoiceRecording(videoStream: MediaStream | null) {
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
      
      // 오디오 트랙은 새로 요청
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // 비디오 트랙은 가능한 경우 프리뷰(webcam) 스트림을 재사용
      let videoTracks: MediaStreamTrack[] = []
      if (videoStream && videoStream.getVideoTracks().length > 0) {
        videoTracks = videoStream.getVideoTracks()
      } else {
        const fallbackVideo = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }
        })
        videoTracks = fallbackVideo.getVideoTracks()
      }
      
      const tracks = [...audioStream.getAudioTracks(), ...videoTracks]
      
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



export default function SurveyQuestion({ 
  questionIndex, 
  onNext, 
  onBack, 
  onComplete, 
  isLastQuestion 
}: SurveyQuestionProps) {
  const [showWarningModal, setShowWarningModal] = useState(false)
  
  // showWarningModal 상태 변화 로그
  useEffect(() => {
    console.log('showWarningModal changed to:', showWarningModal)
  }, [showWarningModal])
  
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null)
  const [showNoResponseWarning, setShowNoResponseWarning] = useState(false)
  const [showRecordingComplete, setShowRecordingComplete] = useState(false)
  
  
  const router = useRouter()
  const pathname = usePathname()
  
  // TTS Hook 사용
  const { 
    state: ttsState, 
    speak: ttsSpeak, 
    stop: ttsStop, 
    isPlaying: isTTSPlaying
  } = useGoogleTTS()
  
  // 녹화 훅 사용
  const { isRecording, recordedMedia, isAutoRecording, startRecording, stopRecording, resetRecording } = useVoiceRecording(webcamStream)

  const currentQuestion = surveyQuestions[questionIndex]
  const progress = ((questionIndex + 1) / surveyQuestions.length) * 100

  // 진행 상황이 있는지 확인 (설문조사 페이지에 들어왔거나 녹화 중이거나 녹화가 완료된 경우)
  const hasProgress = true // 항상 true로 설정하여 모달이 나타나도록 함
  
  // 디버깅을 위한 로그
  console.log('hasProgress:', hasProgress, 'questionIndex:', questionIndex, 'isRecording:', isRecording, 'recordedMedia:', recordedMedia)

  // 페이지 이탈 방지 이벤트 핸들러들
  const handleKeyDown = (e: KeyboardEvent) => {
    if (hasProgress && (e.key === 'Escape' || e.key === 'Backspace')) {
      e.preventDefault()
      console.log('Setting showWarningModal to true (handleKeyDown)')
      setShowWarningModal(true)
    }
  }

  const handlePopState = (e: PopStateEvent) => {
    console.log('handlePopState called, hasProgress:', hasProgress)
    if (hasProgress) {
      e.preventDefault()
      // 페이지 이탈 시 TTS 음소거
      muteAllAudio()
      console.log('Setting showWarningModal to true (handlePopState)')
      setShowWarningModal(true)
      // 브라우저 히스토리에 다시 추가
      window.history.pushState(null, '', window.location.href)
    }
  }

  // 새로고침 방지를 위한 커스텀 핸들러
  const handleRefresh = (e: KeyboardEvent) => {
    console.log('handleRefresh called, hasProgress:', hasProgress, 'key:', e.key)
    if (hasProgress && (e.key === 'F5' || (e.ctrlKey && e.key === 'r'))) {
      e.preventDefault()
      // 페이지 새로고침 시 TTS 음소거
      muteAllAudio()
      console.log('Setting showWarningModal to true (handleRefresh)')
      setShowWarningModal(true)
    }
  }

  // navbar 링크 클릭 감지를 위한 전역 이벤트 리스너
  const handleNavbarLinkClick = (e: MouseEvent) => {
    console.log('handleNavbarLinkClick called, hasProgress:', hasProgress)
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
        // navbar 클릭 시 TTS 음소거
        muteAllAudio()
        console.log('Setting showWarningModal to true (handleNavbarLinkClick)')
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
                  // navbar 링크/버튼 클릭 시 TTS 음소거
        muteAllAudio()
        console.log('Setting showWarningModal to true (handleEnhancedNavbarClick)')
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
                    // 전역 클릭 감지 시 TTS 음소거
        muteAllAudio()
        console.log('Setting showWarningModal to true (handleGlobalClick)')
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
      console.log('Setting showWarningModal to true (handleBackClick)')
      setShowWarningModal(true)
    } else {
      // TTS 음소거 후 뒤로가기
      muteAllAudio()
      onBack()
    }
  }

  const handleConfirmExit = () => {
    console.log('handleConfirmExit called')
    // 페이지 이탈 시 TTS 음소거
    muteAllAudio()
    setShowWarningModal(false)
    onBack()
  }

  const handleCancelExit = () => {
    console.log('handleCancelExit called')
    setShowWarningModal(false)
  }

  // TTS 관련 함수들
  const speakQuestion = useCallback(async (text: string) => {
    const result = await ttsSpeak({
      text,
      language: 'ko-KR'
    })

    if (!result.success) {
      console.error('TTS 오류:', result.error)
    }
  }, [ttsSpeak])

  

  const stopTTS = useCallback(() => {
    ttsStop()
  }, [ttsStop])



  

  

  useEffect(() => {
    // 컴포넌트 마운트 시 이전 TTS 정리
    forceStopAllAudio()
    
    return () => {
      // 컴포넌트 언마운트 시 음소거
      muteAllAudio()
    }
  }, [])

  // 페이지 이탈 시 TTS 음소거를 위한 추가 useEffect
  useEffect(() => {
    // 강화된 페이지 이탈 감지 설정
    const cleanup = setupTTSLeaveDetection()

    return () => {
      // 컴포넌트 언마운트 시 정리
      cleanup()
      muteAllAudio()
    }
  }, [])

  // 라우터 경로 변경 감지하여 TTS 음소거
  useEffect(() => {
    // pathname이 변경되면 TTS 음소거
    if (pathname !== '/main-elder/daily-survey/question/1' && 
        pathname !== '/main-elder/daily-survey/question/2' && 
        pathname !== '/main-elder/daily-survey/question/3') {
      muteAllAudio()
    }
  }, [pathname])

  // 윈도우 포커스 변경 시 TTS 중지 (이미 setupTTSLeaveDetection에서 처리됨)
  // useEffect(() => {
  //   const handleWindowBlur = () => {
  //     // 윈도우가 포커스를 잃으면 TTS 중지
  //     forceStopAllAudio()
  //   }

  //   const handleWindowFocus = () => {
  //     // 윈도우가 포커스를 얻으면 TTS 중지 (안전장치)
  //     forceStopAllAudio()
  //   }

  //   window.addEventListener('blur', handleWindowBlur)
  //   window.addEventListener('focus', handleWindowFocus)

  //   return () => {
  //     window.removeEventListener('blur', handleWindowBlur)
  //     window.removeEventListener('focus', handleWindowFocus)
  //   }
  // }, [])

  // 질문 변경 시 TTS 실행 (단일 실행 보장)
  useEffect(() => {
    // 이전 TTS 정리
    forceStopAllAudio()
    
    // 약간의 지연 후 새로운 TTS 실행
    const timer = setTimeout(() => {
      const question = surveyQuestions[questionIndex]
      if (question) {
        const questionText = `${question.title} ${question.description}`
        speakQuestion(questionText)
      }
    }, 100)
    
    return () => {
      clearTimeout(timer)
      forceStopAllAudio()
    }
  }, [questionIndex, speakQuestion]) // questionIndex가 변경될 때만 실행

  // 녹음 시작 시 TTS 중지
  useEffect(() => {
    if (isRecording) {
      ttsStop()
    }
  }, [isRecording, ttsStop])

  const handleNextQuestion = () => {
    // 응답이 없으면 경고 표시
    if (!recordedMedia && !isRecording) {
      setShowNoResponseWarning(true)
      return
    }

    // 현재 녹화 파일 다운로드
    downloadAllRecordings()

    if (isLastQuestion) {
      // 마지막 질문이면 완료 처리
      onComplete()
    } else {
      // 다음 질문으로 이동
      onNext()
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



  const getQuestionIcon = (index: number) => {
    switch (index) {
      case 0: return <User className="w-5 h-5" />
      case 1: return <Brain className="w-5 h-5" />
      case 2: return <Heart className="w-5 h-5" />
      default: return <User className="w-5 h-5" />
    }
  }



  const replayQuestion = useCallback(() => {
    const question = surveyQuestions[questionIndex]
    if (question) {
      const questionText = `${question.title} ${question.description}`
      speakQuestion(questionText)
    }
  }, [questionIndex, speakQuestion])

  const handleCloseNoResponseWarning = () => {
    setShowNoResponseWarning(false)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Header Section */}
      <div className="pt-10 pb-6 px-6" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handleBackClick}
              aria-label="돌아가기"
              className="flex items-center gap-3 text-gray-800 hover:text-gray-900 transition-colors text-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 rounded-lg px-2 py-1"
            >
              <ArrowLeft className="w-6 h-6" aria-hidden="true" />
              <span className="font-semibold">돌아가기</span>
            </button>
            
            <div className="text-center">
              <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
                일일 설문조사
              </h1>
              <p className="text-gray-700 text-lg font-medium">
                개인화 질문 <span className="font-bold text-gray-900">{questionIndex + 1}</span> / {surveyQuestions.length}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-gray-700 text-base">진행률</p>
              <p className="text-3xl font-extrabold text-blue-700">{Math.round(progress)}%</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div 
            role="progressbar" 
            aria-label="설문 진행률" 
            aria-valuenow={Math.round(progress)} 
            aria-valuemin={0} 
            aria-valuemax={100}
            className="w-full bg-gray-300 rounded-full h-3"
          >
            <div
              className="bg-blue-700 h-3 rounded-full transition-all duration-300"
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
                  {getQuestionIcon(questionIndex)}
                </div>
                <span className="text-blue-600 font-medium">
                  {currentQuestion.category}
                </span>
              </div>

              {/* Question Title */}
              <div className="mb-5">
                <h2 className="text-3xl font-extrabold text-gray-900 leading-snug">
                  {currentQuestion.title}
                </h2>
              </div>

              {/* Question Description */}
              <p className="text-gray-800 mb-8 text-lg leading-relaxed">
                {currentQuestion.description}
              </p>

              {/* Recording Area */}
              <div className="border border-gray-300 rounded-2xl p-7 mb-8 bg-white">
                {/* 녹음 중 상태 */}
                {isRecording && (
                  <div className="mb-6" role="status" aria-live="polite">
                    <div className="bg-red-50 border border-red-300 rounded-xl p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center">
                          <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                        </div>
                        <div>
                          <p className="font-bold text-red-800 text-xl">녹음 중입니다</p>
                          <p className="text-base text-red-700">답변을 마치시면 정지 버튼을 눌러주세요</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 녹화 완료 안내문 (2초간 표시) */}
                {showRecordingComplete && (
                  <div className="mb-6" role="status" aria-live="polite">
                    <div className="bg-green-50 border border-green-300 rounded-xl p-6">
                      <div className="flex items-center justify-center gap-4">
                        <CheckCircle className="w-7 h-7 text-green-700" aria-hidden="true" />
                        <div className="text-center">
                          <p className="font-bold text-green-800 text-xl">녹화가 완료되었습니다</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 녹음된 미디어 재생 */}
                {recordedMedia && !isRecording && (
                  <div className="mb-8">
                    <div className="bg-gray-50 border border-gray-300 rounded-xl p-6">
                      <div className="flex items-center justify-center">
                        <video controls src={recordedMedia} className="w-full max-w-xl rounded-xl" aria-label="녹화된 답변 재생" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 컨트롤 버튼들 */}
                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={replayQuestion}
                    aria-label="질문 다시 재생"
                    className="flex items-center gap-3 px-6 py-3 border-2 border-blue-400 rounded-xl text-blue-700 hover:bg-blue-50 bg-white transition-colors text-lg font-semibold focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
                  >
                    <RotateCcw className="w-5 h-5" aria-hidden="true" />
                    다시 재생
                  </button>

                  <button
                    onClick={isRecording ? stopRecording : () => {
                      // 수동 녹음 버튼 클릭 시 TTS 즉시 중지
                      ttsStop()
                      startRecording(false)
                    }}
                    disabled={isTTSPlaying}
                    aria-label={isRecording ? '녹음 중지' : '녹음 시작'}
                    aria-pressed={isRecording}
                    className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg transition-colors focus:outline-none focus-visible:ring-4 ${
                      isRecording
                        ? "bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-300"
                        : isTTSPlaying
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 text-white focus-visible:ring-green-300"
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-6 h-6" aria-hidden="true" />
                        녹음 중지
                      </>
                    ) : isTTSPlaying ? (
                      <>
                        <Mic className="w-6 h-6" aria-hidden="true" />
                        답변하기
                      </>
                    ) : (
                      <>
                        <Mic className="w-6 h-6" aria-hidden="true" />
                        답변하기
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleNextQuestion}
                    disabled={!recordedMedia && !isRecording}
                    aria-label={isLastQuestion ? '설문 완료' : '다음 질문'}
                    className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg transition-colors focus:outline-none focus-visible:ring-4 ${
                      recordedMedia || isRecording
                        ? "bg-blue-700 hover:bg-blue-800 text-white focus-visible:ring-blue-300"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {isLastQuestion ? '설문 완료' : '다음 질문'}
                    <ArrowRight className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Webcam View */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6" aria-label="웹캠 미리보기">
              <WebcamView
                isRecording={isRecording}
                onStreamReady={setWebcamStream}
                stream={webcamStream}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="fixed bottom-6 left-6 right-6">
        <div className="max-w-6xl mx-auto flex items-center justify-end">
          {/* Page Navigation */}
          <div className="flex gap-3">
            {[1, 2, 3].map((page) => (
              <button
                key={page}
                className={`w-10 h-10 rounded-full text-base font-bold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${
                  page === questionIndex + 1
                    ? "bg-blue-700 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
                aria-current={page === questionIndex + 1 ? 'page' : undefined}
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
                    <p className="text-2xl font-bold">{questionIndex + 1}/{surveyQuestions.length}</p>
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
                  {questionIndex < surveyQuestions.length && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
                      <p>• {surveyQuestions[questionIndex].title}</p>
                    </div>
                  )}
                  {/* 남은 질문들 */}
                  {surveyQuestions.slice(questionIndex + 1).map((question, index) => (
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