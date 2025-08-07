"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import SurveyCompleteModal from "../SurveyCompleteModal"
import { FloatingButtons } from "@/components/common/Floting-Buttons"

export default function CompletePage() {
  const router = useRouter()

  const handleConfirmComplete = () => {
    // recall-training으로 이동
    router.push('/main-elder/recall-training')
  }

  // 페이지 로드 시 모달 자동 표시
  useEffect(() => {
    // 모달이 자동으로 표시되도록 설정
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8FAFC' }}>
      <SurveyCompleteModal 
        isOpen={true}
        onConfirm={handleConfirmComplete}
      />
      <FloatingButtons />
    </div>
  )
}
