"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useDailySurveyQuestions } from "../../surveyData"
import SurveyQuestion from "../../SurveyQuestion"
import { setDailySurveyCompleted, getCurrentUserId } from "@/lib/auth"
import { FloatingButtons } from "@/components/common/Floting-Buttons"

export default function QuestionPage() {
  const params = useParams()
  const router = useRouter()
  const { questions: surveyQuestions, isLoading, error } = useDailySurveyQuestions()
  
  const questionId = parseInt(params.id as string)
  const currentQuestion = surveyQuestions[questionId - 1] // 배열 인덱스는 0부터 시작

  // 유효하지 않은 질문 ID인 경우 첫 번째 질문으로 리다이렉트
  useEffect(() => {
    if (!isLoading && !error) {
      if (questionId < 1 || questionId > surveyQuestions.length) {
        router.push('/main-elder/daily-survey/question/1')
      }
    }
  }, [questionId, router, isLoading, error, surveyQuestions.length])

  const handleBackToIntro = () => {
    router.push('/main-elder/daily-survey')
  }

  const handleNextQuestion = () => {
    if (questionId < surveyQuestions.length) {
      // 다음 질문으로 이동
      router.push(`/main-elder/daily-survey/question/${questionId + 1}`)
    } else {
      // 마지막 질문이면 완료 처리
      handleCompleteSurvey()
    }
  }

  const handleCompleteSurvey = () => {
    // 일일 설문조사 완료 상태 저장
    const userId = getCurrentUserId()
    if (userId) {
      setDailySurveyCompleted(userId)
    }
    // 완료 페이지로 이동
    router.push('/main-elder/daily-survey/complete')
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
    <div className="min-h-screen">
      <SurveyQuestion 
        questionIndex={questionId - 1} // 0부터 시작하는 인덱스로 변환
        onNext={handleNextQuestion}
        onBack={handleBackToIntro}
        onComplete={handleCompleteSurvey}
        isLastQuestion={questionId === surveyQuestions.length}
      />
      <FloatingButtons />
    </div>
  )
}
