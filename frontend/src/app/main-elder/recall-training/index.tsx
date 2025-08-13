"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FloatingButtons } from "@/components/common/Floting-Buttons"
import { 
  ArrowLeft,
  Star,
  Search,
  MousePointer,
  BookOpen,
  Brain,
  Music,
  Camera,
  Play,
  Clock,
  MessageCircle,
  CheckCircle,
  RefreshCw
} from "lucide-react"
import { motion } from "framer-motion"
import { 
  getCompletedRecallTrainingSessions, 
  getIncompleteRecallTrainingSessions,
  isRecallTrainingSessionCompleted,
  clearRecallTrainingProgress,
  type RecallTrainingSession
} from "@/lib/auth"

export default function RecallTrainingMain() {
  const router = useRouter()
  const [completedSessions, setCompletedSessions] = useState<RecallTrainingSession[]>([])
  const [incompleteSessions, setIncompleteSessions] = useState<RecallTrainingSession[]>([])


  useEffect(() => {
    updateSessionStatus()
  }, [])

  const updateSessionStatus = () => {
    const completed = getCompletedRecallTrainingSessions()
    const incomplete = getIncompleteRecallTrainingSessions()
    setCompletedSessions(completed)
    setIncompleteSessions(incomplete)
  }

  const handleBack = () => {
    router.push('/main-elder')
  }

  const handleStartTraining = (sessionId: string) => {
    router.push(`/main-elder/recall-training/${sessionId}`)
  }



  const sessionConfig = {
    memory: {
      title: "기초 질문",
      description: "기초 질문으로 시작해보세요",
      longDescription: "일상적인 기본 질문들을 통해 긴장을 풀고 자연스럽게 기억을 되살려보는 프로그램입니다.",
      icon: Brain,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-100 to-blue-200",
      bgImage: "/images/기초질문배경.jpg",
      step: "1",
      category: "기초질문",
      questions: 3
    },
    story: {
      title: "개인화 질문",
      description: "개인의 특별한 인생 이야기들",
      longDescription: "맞춤형 심층 질문으로 개인의 경험과 관심사를 바탕으로 한 맞춤형 대화를 통해 소통 능력을 향상시킵니다.",
      icon: BookOpen,
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-100 to-red-100",
      bgImage: "/images/개인화질문배경.png",
      step: "2",
      category: "개인화질문",
      questions: 2
    },
    music: {
      title: "들려오는 추억",
      description: "음악과 일상소리로 기억을 자극해보세요",
      longDescription: "음악과 다양한 일상소리를 통해 인지 능력을 자극하고 감정을 되살리는 프로그램입니다.",
      icon: Music,
      gradient: "from-green-500 to-teal-500",
      bgGradient: "from-green-100 to-teal-100",
      bgImage: "/images/인지자극질문음악배경.png",
      step: "3",
      category: "인지자극질문",
      questions: 3
    },
    photo: {
      title: "추억의 시대",
      description: "그 시절 사회 모습으로 떠나는 시간여행",
      longDescription: "1960-1980년대 한국의 사회적 이슈와 시대상을 담은 사진들로 그 시절 추억을 되살려보는 프로그램입니다.",
      icon: Camera,
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-100 to-pink-100",
      bgImage: "/images/인지자극질문사진배경.jpg",
      step: "4",
      category: "인지자극질문",
      questions: 3
    }
  }

  const renderSessionCard = (sessionId: RecallTrainingSession) => {
    const config = sessionConfig[sessionId]
    const IconComponent = config.icon
    const isCompleted = isRecallTrainingSessionCompleted(sessionId)

    return (
      <Card
        key={sessionId}
        className={`bg-white/95 backdrop-blur border-0 shadow-xl overflow-hidden ${isCompleted ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => {
          if (!isCompleted) handleStartTraining(sessionId)
        }}
        tabIndex={0}
        role="button"
        aria-disabled={isCompleted}
        style={isCompleted ? { pointerEvents: 'none' } : {}}
      >
        <div className={`bg-gradient-to-r ${config.gradient} p-6 text-white relative`}>
          {isCompleted && (
            <div className="absolute top-4 right-4 bg-white/20 rounded-full p-2">
              <CheckCircle className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">{config.step}</span>
              </div>
              <IconComponent className="w-6 h-6" />
            </div>
            <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
              {config.category}
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-2">{config.title}</h3>
          <p className="text-white/90">{config.description}</p>
          {isCompleted && (
            <div className="mt-2 text-white/80 text-sm">
              ✓ {config.questions}개 질문 완료
            </div>
          )}
        </div>
        <CardContent className="p-6">
          <div className="mb-6">
            <div className={`w-full h-48 bg-gradient-to-br ${config.bgGradient} rounded-lg flex items-center justify-center`}>
              <div className={`w-full h-48 rounded-lg flex items-center justify-center ${config.bgImage ? 'bg-cover bg-center' : `bg-gradient-to-br ${config.bgGradient}`}`} style={config.bgImage ? { backgroundImage: `url(${config.bgImage})` } : {}}></div>
            </div>
          </div>
          <p className="text-gray-600 mb-6">{config.longDescription}</p>
          <div className="flex items-center gap-6 mb-6">
            <div className="flex items-center gap-2 text-gray-500">
              <Clock className="w-4 h-4" />
              <span className="text-sm">15분</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{config.category}</span>
            </div>
          </div>
          <Button 
            onClick={e => {
              e.stopPropagation()
              handleStartTraining(sessionId)
            }}
            className={`w-full bg-gradient-to-r ${config.gradient} text-white hover:opacity-90 py-3 ${isCompleted ? 'opacity-50' : ''}`}
            disabled={isCompleted}
          >
            {isCompleted ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" aria-hidden="true" />
                완료됨
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                시작하기
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }



  const sessionsToShow = Object.keys(sessionConfig) as RecallTrainingSession[]

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-emerald-100 to-violet-100 relative">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* 첫 번째 섹션: 메인 질문과 추천 프로그램 순서 */}
          <motion.section 
            className="mb-12"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
                        {/* 메인 질문 */}
                        <div className="mb-12">
              <h1 className="text-5xl font-bold text-gray-800 mb-6 text-center" style={{ fontFamily: "Paperlogy, sans-serif" }}>
                어떤 <span className="text-purple-600">추억 여행</span>을 떠나고 싶으신가요?
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed text-center">
                개인 맞춤형 회상 훈련 프로그램으로 소중한 기억들을 되살리고 새로운 추억을 만들어보세요
              </p>
            </div>
            {/* 통합 진행도 및 추천 순서 그래프 섹션 */}
            <div className="w-full max-w-5xl mx-auto mb-8">
              <Card className="bg-white/95 backdrop-blur border-0 shadow-xl overflow-hidden">
                <CardContent className="p-0">
                  {/* 헤더 섹션 */}
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                          <Star className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">나의 추억 여행 진행도</h2>
                          <p className="text-white/90">
                            {completedSessions.length > 0 
                              ? `${completedSessions.length}/4 세션 완료 (${Math.round((completedSessions.length / 4) * 100)}%)`
                              : "추억 여행을 시작해보세요!"
                            }
                          </p>
                        </div>
                      </div>
                      
                    </div>
                  </div>

                  {/* 메인 그래프 섹션 */}
                  <div className="p-8">
                    {/* 진행도 바 */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">전체 진행률</span>
                        <span className="text-sm font-bold text-purple-600">
                          {Math.round((completedSessions.length / 4) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(completedSessions.length / 4) * 100}%` }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                        />
                      </div>
                    </div>

                    {/* 프로그램 단계별 그래프 */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {(Object.keys(sessionConfig) as RecallTrainingSession[]).map((sessionId, index) => {
                        const config = sessionConfig[sessionId]
                        const IconComponent = config.icon
                        const isCompleted = isRecallTrainingSessionCompleted(sessionId)
                        const isNext = !isCompleted && completedSessions.length === index
                        const isLocked = !isCompleted && completedSessions.length < index

                        return (
                          <motion.div
                            key={sessionId}
                            className={`relative ${!isLocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                            onClick={() => {
                              if (!isLocked) handleStartTraining(sessionId)
                            }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.2, duration: 0.6 }}
                            whileHover={!isLocked ? { scale: 1.05 } : {}}
                          >
                            {/* 연결 화살표 (마지막 제외) */}
                            {index < 3 && (
                              <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                                <div className={`w-6 h-0.5 ${isCompleted ? 'bg-green-400' : 'bg-gray-300'}`}>
                                  <div className={`w-0 h-0 border-l-[6px] border-t-[3px] border-b-[3px] border-t-transparent border-b-transparent absolute right-0 top-1/2 transform -translate-y-1/2 ${isCompleted ? 'border-l-green-400' : 'border-l-gray-300'}`}></div>
                                </div>
                              </div>
                            )}

                            {/* 카드 */}
                            <div className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                              isCompleted 
                                ? 'border-green-400 bg-green-50' 
                                : isNext 
                                  ? 'border-yellow-400 bg-yellow-50 shadow-lg' 
                                  : isLocked 
                                    ? 'border-gray-200 bg-gray-50 opacity-60' 
                                    : 'border-gray-200 bg-white hover:border-purple-300'
                            }`}>
                              {/* 상단 색상 바 */}
                              <div className={`h-2 bg-gradient-to-r ${config.gradient}`} />
                              
                              {/* 컨텐츠 */}
                              <div className="p-4">
                                {/* 아이콘과 단계 */}
                                <div className="flex items-center justify-between mb-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    isCompleted 
                                      ? 'bg-green-100 text-green-600' 
                                      : isNext 
                                        ? 'bg-yellow-100 text-yellow-600' 
                                        : `bg-gradient-to-r ${config.gradient} text-white`
                                  }`}>
                                    {isCompleted ? (
                                      <CheckCircle className="w-5 h-5" />
                                    ) : (
                                      <IconComponent className="w-5 h-5" />
                                    )}
                                  </div>
                                  <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                                    isCompleted 
                                      ? 'bg-green-100 text-green-600' 
                                      : isNext 
                                        ? 'bg-yellow-100 text-yellow-600' 
                                        : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    STEP {config.step}
                                  </div>
                                </div>

                                {/* 제목과 설명 */}
                                <h3 className={`font-bold mb-2 ${
                                  isLocked ? 'text-gray-400' : 'text-gray-800'
                                }`}>
                                  {config.title}
                                </h3>
                                <p className={`text-xs mb-3 ${
                                  isLocked ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  {config.description}
                                </p>

                                {/* 상태 표시 */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    <span>15분</span>
                                  </div>
                                  <div className={`text-xs font-medium ${
                                    isCompleted 
                                      ? 'text-green-600' 
                                      : isNext 
                                        ? 'text-yellow-600' 
                                        : isLocked 
                                          ? 'text-gray-400' 
                                          : 'text-purple-600'
                                  }`}>
                                    {isCompleted 
                                      ? '완료' 
                                      : isNext 
                                        ? '다음 단계' 
                                        : isLocked 
                                          ? '잠김' 
                                          : '시작 가능'
                                    }
                                  </div>
                                </div>

                                {/* 액션 버튼 */}
                                {!isLocked && (
                                  <Button 
                                    className={`w-full mt-3 text-xs py-2 ${
                                      isCompleted 
                                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                        : isNext 
                                          ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500 shadow-md' 
                                          : `bg-gradient-to-r ${config.gradient} text-white hover:opacity-90`
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleStartTraining(sessionId)
                                    }}
                                    disabled={isLocked}
                                  >
                                    {isCompleted ? (
                                      <>
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        다시하기
                                      </>
                                    ) : (
                                      <>
                                        <Play className="w-3 h-3 mr-1" />
                                        {isNext ? '지금 시작!' : '시작하기'}
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>

                              {/* 특별 효과 */}
                              {isNext && (
                                <motion.div
                                  className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl opacity-20"
                                  animate={{ 
                                    opacity: [0.2, 0.4, 0.2],
                                    scale: [1, 1.02, 1]
                                  }}
                                  transition={{ 
                                    duration: 2, 
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                  }}
                                />
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>

                    {/* 하단 설명 */}
                    <div className="mt-8 p-4 bg-purple-50 rounded-lg border border-purple-100">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-purple-600 text-sm">💡</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-purple-800 mb-1">추천 진행 순서</h4>
                          <p className="text-sm text-purple-700">
                            <span className="font-medium">기초질문</span>으로 시작해서 
                            <span className="font-medium"> 개인화질문</span>, 
                            <span className="font-medium"> 들려오는 추억</span>, 
                            <span className="font-medium"> 추억의 시대</span> 순서로 진행하시면 
                            가장 효과적으로 기억을 되살릴 수 있습니다.
                          </p>
                        </div>
                      </div>
                    </div>


                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.section>

          {/* 두 번째 섹션: 기억 꺼내기와 이야기 나누기 */}
          <motion.section 
            className="mb-8"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="grid md:grid-cols-2 gap-6 w-full">
              {sessionsToShow.includes('memory') && renderSessionCard('memory')}
              {sessionsToShow.includes('story') && renderSessionCard('story')}
            </div>
          </motion.section>

          {/* 세 번째 섹션: 들려오는 추억과 추억의 시대 */}
          <motion.section 
            className="mb-8"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="grid md:grid-cols-2 gap-6 w-full">
              {sessionsToShow.includes('music') && renderSessionCard('music')}
              {sessionsToShow.includes('photo') && renderSessionCard('photo')}
            </div>
          </motion.section>
        </div>
      </div>
      <FloatingButtons />
    </>
  )
} 