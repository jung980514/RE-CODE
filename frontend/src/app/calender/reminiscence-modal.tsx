"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { TrainingRecord, Question, KeyMoment, Video } from "@/app/calender/page"
import { Clock, PlayCircle, ChevronDown, ChevronUp, Play } from "lucide-react"

// API 응답 타입 정의
interface EmotionData {
  userId: number
  summaryDate: string
  answerType: "BASIC" | "PERSONAL" | "COGNITIVE_AUDIO" | "COGNITIVE_IMAGE"
  dominantEmotion: string | null
  createdAt: string | null
}

interface VideoItem {
  answerId: number
  questionId: number
  content: string
  url: string
  score: number
  createdAt: string
  match: boolean
}

interface VideoCategory {
  date: string
  hasData: boolean
  items: VideoItem[]
}

interface VideoData {
  cognitiveImage: VideoCategory
  personal: VideoCategory
  basic: VideoCategory
  cognitiveAudio: VideoCategory
}

interface ReminiscenceModalProps {
  isOpen: boolean
  onClose: () => void
  record: TrainingRecord
}

// answerType별 이모지 매핑 함수
const getEmotionEmoji = (answerType: string, dominantEmotion: string | null): string => {
  if (dominantEmotion) {
    // dominantEmotion이 있으면 해당 감정에 맞는 이모지 반환
    switch(dominantEmotion.toLowerCase()) {
      case 'happy':
      case 'joy':
        return '😊'
      case 'sad':
      case 'sadness':
        return '😢'
      case 'angry':
      case 'anger':
        return '😠'
      case 'fear':
        return '😨'
      case 'surprise':
        return '😲'
      case 'disgust':
        return '🤢'
      case 'neutral':
        return '😐'
      default:
        return '😊'
    }
  }
  
  // dominantEmotion이 null이면 😊 반환
  return '😊'
}

// answerType 한글 변환
const getAnswerTypeKorean = (answerType: string): string => {
  switch(answerType) {
    case 'BASIC':
      return '기초 질문'
    case 'PERSONAL':
      return '개인화 질문'
    case 'COGNITIVE_AUDIO':
      return '인지 자극(소리)'
    case 'COGNITIVE_IMAGE':
      return '인지 자극(이미지)'
    default:
      return answerType
  }
}

export function ReminiscenceModal({ isOpen, onClose, record }: ReminiscenceModalProps) {
  const [emotionData, setEmotionData] = useState<EmotionData[]>([])
  const [videoData, setVideoData] = useState<VideoData | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedVideos, setExpandedVideos] = useState<Record<string, number>>({})

  if (!record) return null

  const formattedDate = new Date(record.date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })

  // API 호출 함수
  const fetchEmotionAndVideoData = async (date: string) => {
    try {
      setLoading(true)
      
      // 감정 데이터 API 호출
      const emotionResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/calendar/${date}/emotions`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      })

      // 비디오 데이터 API 호출
      const videoResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/calendar/${date}/videos`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      })

      if (emotionResponse.ok) {
        const emotionResult = await emotionResponse.json()
        if (emotionResult.status === 'success') {
          setEmotionData(emotionResult.data || [])
        }
      }

      if (videoResponse.ok) {
        const videoResult = await videoResponse.json()
        if (videoResult.status === 'success') {
          setVideoData(videoResult.data || null)
        }
      }
    } catch (error) {
      console.error('API 호출 중 오류 발생:', error)
    } finally {
      setLoading(false)
    }
  }

  // 모달이 열릴 때 API 호출
  useEffect(() => {
    if (isOpen && record.date) {
      fetchEmotionAndVideoData(record.date)
    }
  }, [isOpen, record.date])

  // 해당 섹션으로 스크롤하는 함수
  const scrollToSection = (answerType: string) => {
    const sectionId = getSectionId(answerType)
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      })
    }
  }

  // answerType에 맞는 섹션 ID 생성
  const getSectionId = (answerType: string): string => {
    switch(answerType) {
      case 'BASIC':
        return 'basic-section'
      case 'PERSONAL':
        return 'personal-section'
      case 'COGNITIVE_AUDIO':
        return 'cognitiveAudio-section'
      case 'COGNITIVE_IMAGE':
        return 'cognitiveImage-section'
      default:
        return ''
    }
  }



  const renderVideoSection = (categoryKey: string, category: VideoCategory, emotionForCategory?: EmotionData) => {
    if (!category.hasData || category.items.length === 0) {
      return null
    }

    const emoji = emotionForCategory ? 
      getEmotionEmoji(emotionForCategory.answerType, emotionForCategory.dominantEmotion) : 
      getEmotionEmoji(categoryKey.toUpperCase(), null)

    const koreanTitle = getAnswerTypeKorean(categoryKey.toUpperCase())
    
    // 현재 카테고리에서 확장된 비디오 (기본적으로 첫 번째)
    const expandedVideoKey = `${categoryKey}-expanded`
    const expandedVideoIndex = expandedVideos[expandedVideoKey] !== undefined ? 
      expandedVideos[expandedVideoKey] : 0

    const handleVideoClick = (index: number) => {
      setExpandedVideos(prev => ({
        ...prev,
        [`${categoryKey}-expanded`]: index
      }))
    }

    return (
      <div key={categoryKey} id={getSectionId(categoryKey.toUpperCase())} className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-gray-800" style={{fontFamily: 'Paperlogy'}}>
                {koreanTitle}
              </h2>
              <span className="text-xl text-gray-600 font-medium" style={{fontFamily: 'Pretendard'}}>
                총 {category.items.length}개 영상
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-4xl">{emoji}</span>
              <span className="text-xl font-bold text-blue-600" style={{fontFamily: 'Pretendard'}}>
                점수 {category.items[expandedVideoIndex]?.score || 0}점
              </span>
            </div>
          </div>
          
          {/* Question/Content */}
          <p className="text-2xl text-gray-700 font-medium leading-relaxed" style={{fontFamily: 'Pretendard'}}>
            {category.items[expandedVideoIndex]?.content || ""}
          </p>
        </div>

        <div className="p-6">
          {/* Video Accordion */}
          <div className="space-y-4 mb-8">
            {category.items.map((video, index) => (
              <div key={video.answerId}>
                {expandedVideoIndex === index ? (
                  /* Expanded Video - Iframe View */
                  <div className="bg-black rounded-lg overflow-hidden shadow-lg">
                    <div className="aspect-video relative">
                      <iframe
                        src={video.url}
                        title={video.content}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                      <div className="absolute top-0 text-white text-xl font-bold bg-black bg-opacity-50 px-3 py-1 rounded" style={{fontFamily: 'Pretendard'}}>
                        {video.content}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Collapsed Video - Card View */
                  <Card
                    className="cursor-pointer hover:bg-blue-50 transition-colors border-2 hover:border-blue-200"
                    onClick={() => handleVideoClick(index)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                          <Play className="w-6 h-6 text-white fill-white ml-1" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-lg font-bold" style={{fontFamily: 'Pretendard'}}>
                              {new Date(video.createdAt).toLocaleDateString("ko-KR", {
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                            <span className="text-xl text-blue-600 font-bold" style={{fontFamily: 'Pretendard'}}>
                              점수: {video.score}점
                            </span>
                          </div>
                          <p className="text-xl text-gray-800 font-medium" style={{fontFamily: 'Pretendard'}}>
                            {video.content}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
          </div>

          {/* Video List Section */}
          {category.items.length > 1 && (
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4" style={{fontFamily: 'Paperlogy'}}>
                영상 목록
              </h3>
              <div className="space-y-3">
                {category.items.map((video, index) => (
                  <div
                    key={`list-${video.answerId}`}
                    className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                      expandedVideoIndex === index 
                        ? "bg-blue-50 border-2 border-blue-300 shadow-md" 
                        : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent hover:border-gray-200"
                    }`}
                    onClick={() => handleVideoClick(index)}
                  >
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-base font-bold min-w-[60px] text-center" style={{fontFamily: 'Pretendard'}}>
                      {new Date(video.createdAt).toLocaleDateString("ko-KR", {
                        month: "2-digit",
                        day: "2-digit"
                      })}
                    </span>
                    <span className="text-2xl text-gray-800 font-medium flex-1" style={{fontFamily: 'Pretendard'}}>
                      {video.content}
                    </span>
                    <span className="text-lg text-blue-600 font-bold" style={{fontFamily: 'Pretendard'}}>
                      {video.score}점
                    </span>
                    {expandedVideoIndex === index && (
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col p-0 bg-gray-50 [&>button]:hidden" onEscapeKeyDown={onClose} onPointerDownOutside={onClose}>
        <DialogHeader className="p-8 pb-6 border-b-2 border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-4xl">📅</span>
              <div>
                <DialogTitle className="text-3xl font-bold text-gray-800 mb-1" style={{fontFamily: 'Paperlogy'}}>
                  {formattedDate}
                </DialogTitle>
                <p className="text-xl text-gray-600 font-medium" style={{fontFamily: 'Pretendard'}}>
                  회상 기록 보기
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-16 h-16 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200 text-3xl text-gray-600 shadow-md hover:shadow-lg"
              aria-label="닫기"
            >
              ×
            </button>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-8 space-y-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow-sm">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-6"></div>
                <span className="text-2xl text-gray-700 font-medium" style={{fontFamily: 'Pretendard'}}>
                  기록을 불러오는 중입니다...
                </span>
                <span className="text-xl text-gray-500 mt-2" style={{fontFamily: 'Pretendard'}}>
                  잠시만 기다려 주세요
                </span>
              </div>
            ) : (
              <>
                {/* 감정 정보 요약 */}
                {emotionData.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-6 border-b bg-blue-50">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">💝</span>
                        <h2 className="text-3xl font-bold text-gray-800" style={{fontFamily: 'Paperlogy'}}>
                          오늘의 감정 상태
                        </h2>
                      </div>
                      <p className="text-xl text-gray-600 mt-2" style={{fontFamily: 'Pretendard'}}>
                        각 활동별로 느꼈던 감정들을 확인해보세요
                      </p>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {emotionData.map((emotion, index) => (
                          <div 
                            key={index} 
                            className="text-center p-4 bg-gray-50 rounded-lg border-2 border-gray-100 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 hover:shadow-md"
                            onClick={() => scrollToSection(emotion.answerType)}
                          >
                            <div className="text-5xl mb-3">
                              {getEmotionEmoji(emotion.answerType, emotion.dominantEmotion)}
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2" style={{fontFamily: 'Pretendard'}}>
                              {getAnswerTypeKorean(emotion.answerType)}
                            </h3>
                            {emotion.dominantEmotion && (
                              <p className="text-lg text-blue-600 font-medium" style={{fontFamily: 'Pretendard'}}>
                                {emotion.dominantEmotion}
                              </p>
                            )}
                            <p className="text-sm text-gray-500 mt-2" style={{fontFamily: 'Pretendard'}}>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 비디오 섹션들 */}
                {videoData && (
                  <>
                    {renderVideoSection('basic', videoData.basic, emotionData.find(e => e.answerType === 'BASIC'))}
                    {renderVideoSection('personal', videoData.personal, emotionData.find(e => e.answerType === 'PERSONAL'))}
                    {renderVideoSection('cognitiveAudio', videoData.cognitiveAudio, emotionData.find(e => e.answerType === 'COGNITIVE_AUDIO'))}
                    {renderVideoSection('cognitiveImage', videoData.cognitiveImage, emotionData.find(e => e.answerType === 'COGNITIVE_IMAGE'))}
                  </>
                )}

                {/* 데이터가 없을 때 */}
                {!loading && (!videoData || (
                  !videoData.basic.hasData && 
                  !videoData.personal.hasData && 
                  !videoData.cognitiveAudio.hasData && 
                  !videoData.cognitiveImage.hasData
                )) && (
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-12 text-center">
                      <div className="text-9xl mb-6">📝</div>
                      <h3 className="text-3xl font-bold text-gray-800 mb-4" style={{fontFamily: 'Paperlogy'}}>
                        이 날의 회상 기록이 없습니다
                      </h3>
                      <p className="text-2xl text-gray-600 leading-relaxed mb-6" style={{fontFamily: 'Pretendard'}}>
                        회상 훈련을 진행하여<br />
                        소중한 기억을 남겨보세요
                      </p>
                      <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                        <p className="text-xl text-blue-700 font-medium" style={{fontFamily: 'Pretendard'}}>
                          💡 회상 훈련은 기억력 향상에 도움이 됩니다
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
