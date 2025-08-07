"use client"

import { useRouter } from "next/navigation"
import SurveyIntro from "./SurveyIntro"
import { FloatingButtons } from "@/components/common/Floting-Buttons"

export default function DailySurveyPage() {
  const router = useRouter()

  const handleStartSurvey = () => {
    // 첫 번째 질문 페이지로 이동
    router.push('/main-elder/daily-survey/question/1')
  }

  return (
    <div className="min-h-screen">
      <SurveyIntro onStartSurvey={handleStartSurvey} />
      <FloatingButtons />
    </div>
  )
} 