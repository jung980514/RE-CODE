"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { setDailySurveyCompleted, getCurrentUserId } from "@/lib/auth"
// import Navbar from "@/components/layout/Navbar"
import SurveyIntro from "./SurveyIntro"
import SurveyForm from "./SurveyForm"
import SurveyCompleteModal from "./SurveyCompleteModal"
import SurveyQuestion from "./SurveyQuestion"

export default function DailySurvey() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<'intro' | 'question' | 'complete'>('intro')
  const [showCompleteModal, setShowCompleteModal] = useState(false)

  const handleStartSurvey = () => {
    setCurrentStep('question')
  }

  const handleBackToIntro = () => {
    setCurrentStep('intro')
  }

  const handleCompleteSurvey = () => {
    // 일일 설문조사 완료 상태 저장
    const userId = getCurrentUserId()
    if (userId) {
      setDailySurveyCompleted(userId)
    }
    setShowCompleteModal(true)
  }

  const handleConfirmComplete = () => {
    setShowCompleteModal(false)
    // recall-training으로 이동
    router.push('/main-elder/recall-training')
  }

  return (
    <div className="min-h-screen">
      
      {currentStep === 'intro' && (
        <SurveyIntro onStartSurvey={handleStartSurvey} />
      )}
      
      {currentStep === 'question' && (
        <SurveyQuestion 
          onComplete={handleCompleteSurvey}
          onBack={handleBackToIntro}
        />
      )}

      <SurveyCompleteModal 
        isOpen={showCompleteModal}
        onConfirm={handleConfirmComplete}
      />
    </div>
  )
}
