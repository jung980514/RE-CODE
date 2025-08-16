"use client"

import { SurveyIntroProps } from "./types"
import { surveyInfo, useDailySurveyQuestions } from "./surveyData"
import { MessageSquare, Mic, Clock, User, Brain, Heart } from "lucide-react"

export default function SurveyIntro({ onStartSurvey }: SurveyIntroProps) {
  const { questions, isLoading, error } = useDailySurveyQuestions()
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-purple-800 mb-6" style={{ fontFamily: "Paperlogy, sans-serif" }}>
            오늘의 일일 설문
          </h1>
          <p className="text-3xl text-gray-600 max-w-4xl mx-auto leading-relaxed" style={{ fontFamily: "Paperlogy, sans-serif" }}>
            가벼운 질문으로 기억력을 체크해보세요
          </p>
        </div>

        {/* Question Preview Section */}
        <div>
          <h2 className="text-5xl font-bold text-purple-800 mb-12 text-left" style={{ fontFamily: "Paperlogy, sans-serif" }}>
            질문 미리보기
          </h2>
          
          <div className="space-y-8">
            {isLoading && (
              <div className="text-gray-600 text-2xl" style={{ fontFamily: "Paperlogy, sans-serif" }}>질문을 불러오는 중...</div>
            )}
            {error && !isLoading && (
              <div className="text-red-600 text-2xl" style={{ fontFamily: "Paperlogy, sans-serif" }}>{error}</div>
            )}
            {!isLoading && !error && questions.map((question, index) => (
              <div
                key={question.id}
                className="relative rounded-xl p-10 shadow-lg"
                style={{ 
                  backgroundColor: question.color,
                  borderLeft: `6px solid ${question.borderColor}`
                }}
              >
                <div className="flex items-start gap-8">
                  <div className="text-5xl mt-2">
                    {question.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-xl font-medium text-purple-800 mb-4" style={{ fontFamily: "Paperlogy, sans-serif" }}>
                      질문 {index + 1} • {question.category}
                    </p>
                    <h3 className="text-3xl font-bold text-purple-800 mb-4" style={{ fontFamily: "Paperlogy, sans-serif" }}>
                      {question.title}
                    </h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Start Survey Button */}
        <div className="flex justify-center mt-20">
          <button
            onClick={onStartSurvey}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-8 px-16 rounded-2xl flex items-center gap-4 transition-colors duration-200 shadow-xl text-3xl"
            style={{ fontFamily: "Paperlogy, sans-serif" }}
          >
            설문 시작하기
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
