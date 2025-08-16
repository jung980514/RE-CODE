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
  RefreshCw,
  HelpCircle
} from "lucide-react"
import { motion } from "framer-motion"
import HelpModal from "./components/help-modal"
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
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // 클라이언트에서만 실행되도록 mounted 상태 설정
    setMounted(true)
    // 로컬스토리지에서 세션 상태 로드
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
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl" style={{ fontFamily: "Paperlogy, sans-serif" }}>{config.step}</span>
              </div>
              <IconComponent className="w-6 h-6" />
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-full text-lg" style={{ fontFamily: "Paperlogy, sans-serif" }}>
              15분
            </div>
          </div>
          <h3 className="text-4xl font-bold mb-4" style={{ fontFamily: "Paperlogy, sans-serif" }}>{config.title}</h3>
          <div className="flex items-center justify-between">
            <p className="text-xl text-white/90" style={{ fontFamily: "Paperlogy, sans-serif" }}>{config.description}</p>
            {isCompleted && (
              <div className="text-white/80 text-lg flex items-center gap-2" style={{ fontFamily: "Paperlogy, sans-serif" }}>
                <CheckCircle className="w-5 h-5" />
                <span>완료</span>
              </div>
            )}
          </div>
        </div>
        <CardContent className="p-6">
          <div className="mb-6">
            <div className={`w-full h-48 bg-gradient-to-br ${config.bgGradient} rounded-lg flex items-center justify-center`}>
              <div className={`w-full h-48 rounded-lg flex items-center justify-center ${config.bgImage ? 'bg-cover bg-center' : `bg-gradient-to-br ${config.bgGradient}`}`} style={config.bgImage ? { backgroundImage: `url(${config.bgImage})` } : {}}></div>
            </div>
          </div>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed" style={{ fontFamily: "Paperlogy, sans-serif" }}>{config.longDescription}</p>
          <Button
            onClick={e => {
              e.stopPropagation()
              handleStartTraining(sessionId)
            }}
            className={`w-full bg-gradient-to-r ${config.gradient} text-white hover:opacity-90 py-8 text-3xl ${isCompleted ? 'opacity-50' : ''}`}
            disabled={isCompleted}
          >
            {isCompleted ? (
              <>
                <span style={{ fontFamily: "Paperlogy, sans-serif" }}>완료됨</span>
              </>
            ) : (
              <>
                <span style={{ fontFamily: "Paperlogy, sans-serif" }}>시작하기</span>
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }



  const sessionsToShow = Object.keys(sessionConfig) as RecallTrainingSession[]

  // 클라이언트에서 마운트되기 전까지는 로딩 표시
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-100 to-violet-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600" style={{ fontFamily: "Paperlogy, sans-serif" }}>로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-emerald-100 to-violet-100 relative">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* 첫 번째 섹션: 메인 질문과 추천 프로그램 순서 */}
          <motion.section
            className="mb-4"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* 메인 질문 */}
            <div className="mb-12 relative">
              <div className="flex items-center justify-center relative mb-2">
                <h1 className="text-5xl font-bold text-gray-800 mb-2 text-center" style={{ fontFamily: "Paperlogy, sans-serif" }}>
                  어떤 <span className="text-purple-600">추억 여행</span>을 떠나고 싶으신가요?
                </h1>
                {/* 도움말 버튼 */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsHelpModalOpen(true)}
                  className="absolute right-0 top-0 rounded-full w-16 h-16 shadow-md bg-white hover:bg-gray-50 border-purple-200 hover:border-purple-300"
                  aria-label="도움말"
                >
                  <HelpCircle className="!h-10 !w-10 text-purple-600" />
                </Button>
              </div>
              <p className="text-3xl text-gray-600 max-w-4xl mx-auto leading-relaxed text-center" style={{ fontFamily: "Paperlogy, sans-serif" }}>
                특정 주제를 선택하거나 1번부터 순서대로 진행할 수 있습니다.
              </p>
            </div>
            {/* 통합 진행도 및 추천 순서 그래프 섹션 */}
            <div className="w-full max-w-5xl mx-auto mb-8">
              <Card className="bg-white/95 backdrop-blur border-0 shadow-xl overflow-hidden">
                <CardContent className="p-0">

                  {/* 메인 그래프 섹션 */}
                  <div className="px-6 py-2">
                    {/* 진행도 바 */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-block bg-purple-100 text-purple-700 font-extrabold px-5 py-2 rounded-full shadow-sm mr-2 text-3xl" style={{ fontFamily: "Paperlogy, sans-serif" }}>
                          진행도
                        </span>
                        <span className="text-3xl font-bold text-gray-700 ml-0" style={{ fontFamily: "Paperlogy, sans-serif" }}>
                          아래의 4가지 훈련을 하나씩 진행하면 진행도가 점점 증가해요!
                        </span>
                        <span className="text-3xl font-bold text-purple-600 ml-2" style={{ fontFamily: "Paperlogy, sans-serif" }}>
                          {Math.round((completedSessions.length / 4) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(completedSessions.length / 4) * 100}%` }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                        />
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
        </div> {/* max-w-6xl ... */}
      </div> {/* min-h-screen ... */}
      <FloatingButtons />

      {/* 도움말 모달 */}
      <HelpModal
        open={isHelpModalOpen}
        onOpenChange={setIsHelpModalOpen}
      />
    </>
  )
}