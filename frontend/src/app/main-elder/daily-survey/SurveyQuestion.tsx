"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import { SurveyQuestionProps } from "./types"
import { useDailySurveyQuestions } from "./surveyData"
import { ArrowLeft, Play, Check, Volume2, Clock, User, Brain, Heart, Mic, MicOff, Video, VideoOff, Download, AlertTriangle, VolumeX, Volume1, ArrowRight, CheckCircle, RotateCcw } from "lucide-react"
import { useGoogleTTS } from "@/api/googleTTS"
import { WebcamView } from "@/components/common/WebcamView"
import { setupTTSLeaveDetection, forceStopAllAudio, muteAllAudio } from "@/utils/ttsCleanup"

// 음성 및 영상 녹화 훅 (미리보기 스트림 재사용)
function useVoiceRecording(previewVideoStream: MediaStream | null) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedMedia, setRecordedMedia] = useState<string | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [isAutoRecording, setIsAutoRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const combinedStreamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const stopResolverRef = useRef<((blob: Blob) => void) | null>(null)

  const startRecording = async (isAuto = false) => {
    try {
      // 기존 스트림 정리
      if (combinedStreamRef.current) {
        combinedStreamRef.current.getTracks().forEach((track) => track.stop())
      }

      // 미리보기 스트림이 준비되지 않은 경우 녹화 불가 (이중 요청 방지)
      if (!previewVideoStream) {
        console.error("웹캠 스트림이 아직 준비되지 않았습니다. 미리보기 준비 후 녹화를 시작해주세요.")
        return
      }

      // 오디오 스트림은 새로 요청 (카메라 스트림은 미리보기의 트랙을 clone하여 사용)
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const clonedVideoTracks = previewVideoStream.getVideoTracks().map((track) => track.clone())

      const tracks = [...audioStream.getAudioTracks(), ...clonedVideoTracks]
      
      const combinedStream = new MediaStream(tracks)
      combinedStreamRef.current = combinedStream

      const mediaRecorder = new MediaRecorder(combinedStream, { mimeType: "video/mp4" })
      mediaRecorderRef.current = mediaRecorder

      // 이전 결과 초기화
      if (recordedMedia) {
        URL.revokeObjectURL(recordedMedia)
      }
      setRecordedMedia(null)
      setRecordedBlob(null)
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        try {
          const finalBlob = new Blob(chunksRef.current, { type: 'video/mp4' })
          setRecordedBlob(finalBlob)
          const mediaUrl = URL.createObjectURL(finalBlob)
          setRecordedMedia(mediaUrl)
          if (stopResolverRef.current) {
            stopResolverRef.current(finalBlob)
            stopResolverRef.current = null
          }
        } finally {
          chunksRef.current = []
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setIsAutoRecording(isAuto)
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
    setRecordedBlob(null)
    
    // ref 초기화
    mediaRecorderRef.current = null
    audioContextRef.current = null
    combinedStreamRef.current = null
    chunksRef.current = []
  }

  const stopAndGetBlob = async (): Promise<Blob> => {
    if (recordedBlob && !isRecording) {
      return recordedBlob
    }
    if (mediaRecorderRef.current && isRecording) {
      return new Promise<Blob>((resolve) => {
        stopResolverRef.current = resolve
        mediaRecorderRef.current?.stop()
        setIsRecording(false)
        setIsAutoRecording(false)
        // 스트림 및 오디오 컨텍스트 정리
        if (combinedStreamRef.current) {
          combinedStreamRef.current.getTracks().forEach((track) => track.stop())
        }
        if (audioContextRef.current) {
          audioContextRef.current.close()
        }
      })
    }
    throw new Error('녹화된 블랍이 없습니다.')
  }

  return {
    isRecording,
    recordedMedia,
    recordedBlob,
    isAutoRecording,
    startRecording,
    stopRecording,
    resetRecording,
    stopAndGetBlob,
  }
}



export default function SurveyQuestion({ 
  questionIndex, 
  onNext, 
  onBack, 
  onComplete, 
  isLastQuestion 
}: SurveyQuestionProps) {
  const { questions: surveyQuestions, isLoading, error } = useDailySurveyQuestions()
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
  const { isRecording, recordedMedia, recordedBlob, isAutoRecording, startRecording, stopRecording, resetRecording, stopAndGetBlob } = useVoiceRecording(webcamStream)
  const [userId, setUserId] = useState<number | null>(null)

  const currentQuestion = surveyQuestions[questionIndex]
  const progress = surveyQuestions.length > 0 ? ((questionIndex + 1) / surveyQuestions.length) * 100 : 0

  // 진행 상황이 있는지 확인 (설문조사 페이지에 들어왔거나 녹화 중이거나 녹화가 완료된 경우)
  const hasProgress = true // 항상 true로 설정하여 모달이 나타나도록 함
  
  // 디버깅 로그: 값이 변경될 때만 출력
  useEffect(() => {
    console.log('hasProgress:', hasProgress, 'questionIndex:', questionIndex, 'isRecording:', isRecording, 'recordedMedia:', recordedMedia)
  }, [hasProgress, questionIndex, isRecording, recordedMedia])

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
    // 최초 진입 시 사용자 ID 확보 (쿠키 세션 포함)
    const fetchUser = async () => {
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
        if (stored) {
          const parsed = Number(stored)
          if (!Number.isNaN(parsed)) {
            setUserId(parsed)
          }
        }
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Accept': 'application/json' },
        })
        if (res.ok) {
          const json = await res.json()
          const idCandidate = json?.data?.id
          if (typeof idCandidate === 'number') {
            setUserId(idCandidate)
            try { localStorage.setItem('userId', String(idCandidate)) } catch {}
          }
        }
      } catch (e) {
        console.error('사용자 정보 조회 오류:', e)
      }
    }
    fetchUser()
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

  // 질문 로딩 완료 후 TTS 실행 (질문 준비를 명확히 기다림)
  useEffect(() => {
    if (isLoading) return
    if (!currentQuestion) return

    // 이전 TTS 정리
    forceStopAllAudio()

    // 약간의 지연 후 새로운 TTS 실행
    const timer = setTimeout(() => {
      const questionText = `${currentQuestion.title} ${currentQuestion.description}`
      speakQuestion(questionText)
    }, 100)

    return () => {
      clearTimeout(timer)
      forceStopAllAudio()
    }
  }, [isLoading, currentQuestion?.id, currentQuestion?.title, currentQuestion?.description, speakQuestion])

  // 녹음 시작 시 TTS 중지
  useEffect(() => {
    if (isRecording) {
      ttsStop()
    }
  }, [isRecording, ttsStop])

  const handleNextQuestion = async () => {
    // 응답이 없으면 경고 표시
    if (!recordedMedia && !isRecording) {
      setShowNoResponseWarning(true)
      return
    }

    // 업로드 시도
    try {
      const questionId = currentQuestion?.id
      if (!questionId) {
        throw new Error('질문 ID가 없습니다')
      }
      let blobToUpload = recordedBlob
      if (isRecording) {
        blobToUpload = await stopAndGetBlob()
      }
      if (blobToUpload) {
        const formData = new FormData()
        formData.append('questionId', String(questionId))
        if (userId != null) {
          formData.append('userId', String(userId))
        }
        formData.append('mediaType', 'video')
        const fileName = `answer_${questionId}_${new Date().toISOString().replace(/[:.]/g, '-')}.mp4`
        const file = new File([blobToUpload], fileName, { type: 'video/mp4' })
        formData.append('videoFile', file)

        const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/survey/answers`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        })
        if (!uploadResponse.ok) {
          console.error('답변 업로드 실패:', uploadResponse.status)
        }
      }
    } catch (err) {
      console.error('답변 업로드 중 오류:', err)
    }

    // 다음 질문으로 이동하기 전에 완료 메시지 숨기기
    setShowRecordingComplete(false)
    
    if (isLastQuestion) {
      // 마지막 질문이면 완료 처리
      onComplete()
    } else {
      // 다음 질문으로 이동
      onNext()
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
    if (!question) return
    // 기존 재생 중인 음성 정지 후 다시 재생
    try { ttsStop() } catch {}
    try { forceStopAllAudio() } catch {}
    const questionText = `${question.title} ${question.description}`
    speakQuestion(questionText)
  }, [questionIndex, speakQuestion, ttsStop])

  const handleCloseNoResponseWarning = () => {
    setShowNoResponseWarning(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">질문을 불러오는 중...</div>
      </div>
    )
  }

  if (error || surveyQuestions.length === 0 || !currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error ?? '질문을 불러오지 못했습니다'}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Header Section */}
      <div className="pt-10 pb-6 px-6" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div></div>
            
            <div className="text-center">
              <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight font-[family-name:var(--font-Paperlogy-7Bold)]">
                일일 설문조사
              </h1>
              <p className="text-gray-700 text-xl font-medium font-[family-name:var(--font-pretendard)]">
                개인화 질문 <span className="font-bold text-gray-900 font-[family-name:var(--font-Paperlogy-7Bold)]">{questionIndex + 1}</span> / {surveyQuestions.length}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-gray-700 text-lg font-[family-name:var(--font-pretendard)] font-medium">진행률</p>
              <p className="text-4xl font-extrabold text-blue-700 font-[family-name:var(--font-Paperlogy-7Bold)]">{Math.round(progress)}%</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:h-[calc(100vh-320px)]">
          {/* Left Column - Question */}
          <div className="lg:col-span-2 flex">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full flex flex-col">
              {/* Question Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  {getQuestionIcon(questionIndex)}
                </div>
                <span className="text-blue-600 font-semibold text-xl font-[family-name:var(--font-pretendard)]">
                  {currentQuestion.category}
                </span>
              </div>

              {/* Question Title */}
              <div className="mb-8">
                <h2 className="text-5xl font-bold text-gray-900 leading-snug font-[family-name:var(--font-Paperlogy-7Bold)] tracking-tight">
                  {currentQuestion.title}
                </h2>
              </div>

              {/* Question Description */}
              <p className="text-gray-700 mb-10 text-2xl leading-relaxed font-[family-name:var(--font-pretendard)] font-medium">
                {currentQuestion.description}
              </p>

              {/* Recording Area */}
              <div className="border border-gray-300 rounded-2xl p-7 mb-8 bg-white flex-grow flex flex-col justify-center">
                {/* 녹음 중 상태 */}
                {isRecording && (
                  <div className="mb-6" role="status" aria-live="polite">
                    <div className="bg-red-50 border border-red-300 rounded-xl p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center">
                          <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                        </div>
                        <div>
                          <p className="font-bold text-red-800 text-2xl font-[family-name:var(--font-Paperlogy-7Bold)]">녹음 중입니다</p>
                          <p className="text-xl text-red-700 font-[family-name:var(--font-pretendard)] font-medium">답변을 마치시면 정지 버튼을 눌러주세요</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 녹화 완료 안내문 (2초간 표시) */}
                {showRecordingComplete && (
                  <div className="mb-6" role="status" aria-live="polite">
                    <div className="bg-green-50 border border-green-300 rounded-xl p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="font-bold text-green-800 text-2xl font-[family-name:var(--font-Paperlogy-7Bold)]">녹화가 완료되었습니다</p>
                          <p className="text-xl text-green-700 font-[family-name:var(--font-pretendard)] font-medium">답변이 성공적으로 저장되었습니다</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 컨트롤 버튼들 */}
                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={replayQuestion}
                    aria-label="질문 다시 재생"
                    disabled={isTTSPlaying}
                    className="flex items-center gap-3 px-8 py-4 border-2 border-blue-400 rounded-xl text-blue-700 hover:bg-blue-50 bg-white transition-colors text-3xl font-semibold font-[family-name:var(--font-pretendard)] focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    다시 재생
                  </button>

                  <button
                    onClick={isRecording ? stopRecording : () => {
                      // 수동 녹음 버튼 클릭 시 TTS 즉시 중지
                      ttsStop()
                      setShowRecordingComplete(false)
                      startRecording(false)
                    }}
                    disabled={isTTSPlaying || !webcamStream}
                    aria-label={isRecording ? '녹음 중지' : '녹음 시작'}
                    aria-pressed={isRecording}
                    className={`flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-3xl font-[family-name:var(--font-pretendard)] transition-colors focus:outline-none focus-visible:ring-4 ${
                      isRecording
                        ? "bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-300"
                        : (isTTSPlaying || !webcamStream)
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 text-white focus-visible:ring-green-300"
                    }`}
                  >
                    {isRecording ? (
                      <>
                        녹음중지
                      </>
                    ) : isTTSPlaying ? (
                      <>
                        답변하기
                      </>
                    ) : (
                      <>
                        답변하기
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleNextQuestion}
                    disabled={!recordedMedia && !isRecording}
                    aria-label={isLastQuestion ? '설문 완료' : '다음 질문'}
                    className={`flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-3xl font-[family-name:var(--font-pretendard)] transition-colors focus:outline-none focus-visible:ring-4 ${
                      recordedMedia || isRecording
                        ? "bg-blue-700 hover:bg-blue-800 text-white focus-visible:ring-blue-300"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {isLastQuestion ? '설문 완료' : '다음 질문'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Webcam View */}
          <div className="lg:col-span-1 flex">
            <div className="bg-white rounded-2xl shadow-lg p-6 w-full flex flex-col" aria-label="웹캠 미리보기">
              <WebcamView
                isRecording={isRecording}
                onStreamReady={setWebcamStream}
                voiceGifMode
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