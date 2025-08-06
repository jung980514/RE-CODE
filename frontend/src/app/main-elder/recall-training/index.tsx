"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(false)
  const [showIncompleteList, setShowIncompleteList] = useState(false)

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

  const handleResetProgress = () => {
    clearRecallTrainingProgress()
    updateSessionStatus()
    setShowOnlyIncomplete(false)
    setShowIncompleteList(false)
  }

  const handleShowIncomplete = () => {
    setShowIncompleteList(!showIncompleteList)
    setShowOnlyIncomplete(!showOnlyIncomplete)
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
      <Card key={sessionId} className={`bg-white/95 backdrop-blur border-0 shadow-xl overflow-hidden ${isCompleted ? 'opacity-75' : ''}`}>
        <div className={`bg-gradient-to-r ${config.gradient} p-6 text-white relative`}>
          {isCompleted && (
            <div className="absolute top-4 right-4 bg-white/20 rounded-full p-2">
              <CheckCircle className="w-5 h-5 text-white" />
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
              <span className="text-sm">5분</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{config.category}</span>
            </div>
          </div>
          <Button 
            onClick={() => handleStartTraining(sessionId)}
            className={`w-full bg-gradient-to-r ${config.gradient} text-white hover:opacity-90 py-3 ${isCompleted ? 'opacity-50' : ''}`}
            disabled={isCompleted}
          >
            {isCompleted ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
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

  const renderIncompleteSessionCard = (sessionId: RecallTrainingSession) => {
    const config = sessionConfig[sessionId]
    const IconComponent = config.icon

    return (
      <Card key={sessionId} className="bg-white/95 backdrop-blur border-0 shadow-lg overflow-hidden">
        <div className={`bg-gradient-to-r ${config.gradient} p-4 text-white`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">{config.step}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold">{config.title}</h3>
              <p className="text-white/90 text-sm">{config.description}</p>
            </div>
            <IconComponent className="w-5 h-5" />
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>5분</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                <span>{config.category}</span>
              </div>
            </div>
            <Button 
              onClick={() => handleStartTraining(sessionId)}
              size="sm"
              className={`bg-gradient-to-r ${config.gradient} text-white hover:opacity-90`}
            >
              <Play className="w-3 h-3 mr-1" />
              시작하기
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const sessionsToShow = showOnlyIncomplete ? incompleteSessions : Object.keys(sessionConfig) as RecallTrainingSession[]

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-100 to-violet-100 relative">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 첫 번째 섹션: 메인 질문과 추천 프로그램 순서 */}
        <motion.section 
          className="mb-12"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* 상단 메시지 */}
          <div className="mb-8 flex justify-center w-full">
            <div className="inline-flex items-center gap-2 bg-blue-100 border border-blue-200 rounded-lg px-4 py-2 mb-6">
              <Star className="w-4 h-4 text-blue-600" />
              <span className="text-blue-800 text-sm">오늘도 소중한 기억을 만들어가요</span>
            </div>
          </div>

          {/* 진행 상황 표시 */}
          {completedSessions.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between bg-white/80 backdrop-blur rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">진행 상황</p>
                    <p className="text-sm text-green-600">
                      {completedSessions.length}/4 세션 완료 ({Math.round((completedSessions.length / 4) * 100)}%)
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShowIncomplete}
                    className="text-sm"
                  >
                    {showOnlyIncomplete ? '전체 보기' : '미완료만 보기'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetProgress}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    초기화
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 미완료 세션 목록 */}
          {showIncompleteList && incompleteSessions.length > 0 && (
            <motion.div 
              className="mb-8"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur rounded-lg p-6 border border-orange-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-bold text-sm">!</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-orange-800">아직 완료하지 않은 세션</h3>
                    <p className="text-sm text-orange-600">아래 세션들을 완료해보세요</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {incompleteSessions.map(sessionId => renderIncompleteSessionCard(sessionId))}
                </div>
              </div>
            </motion.div>
          )}

          {/* 메인 질문 */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-gray-800 mb-6 text-center" style={{ fontFamily: "Paperlogy, sans-serif" }}>
              어떤 <span className="text-purple-600">추억 여행</span>을 떠나고 싶으신가요?
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed text-center">
              개인 맞춤형 회상 훈련 프로그램으로 소중한 기억들을 되살리고 새로운 추억을 만들어보세요
            </p>
          </div>

          {/* 추천 프로그램 순서 */}
          <div className="w-full max-w-4xl mx-auto">
            <Card className="bg-white/95 backdrop-blur border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Star className="w-6 h-6 text-yellow-500" />
                  <h2 className="text-2xl font-bold text-gray-800">추천 프로그램 순서</h2>
                </div>
                <p className="text-gray-600 mb-8">
                  기초질문 → 개인화질문 → 인지자극질문 순서로 진행하시면 더욱 효과적입니다
                </p>
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">기초</span>
                    </div>
                    <div className="text-gray-400">→</div>
                    <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">개인화</span>
                    </div>
                    <div className="text-gray-400">→</div>
                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">소리</span>
                    </div>
                    <div className="text-gray-400">→</div>
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">이미지</span>
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
  )
} 