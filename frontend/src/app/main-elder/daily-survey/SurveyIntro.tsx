"use client"

import { SurveyIntroProps } from "./types"
import { surveyQuestions, surveyInfo } from "./surveyData"
import { MessageSquare, Mic, Clock, User, Brain, Heart } from "lucide-react"

export default function SurveyIntro({ onStartSurvey }: SurveyIntroProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-blue-800 mb-2">
            개인화 설문조사
          </h1>
          <p className="text-lg text-gray-600">
            맞춤형 치매 예방 프로그램을 위한 개인 정보 수집
          </p>
        </div>

        {/* Information Blocks */}
        <div className="flex justify-center gap-8 mb-12">
          {/* 3개 질문 - 파란색 */}
          <div className="text-center">
            <MessageSquare className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="font-semibold text-blue-800 text-lg">{surveyInfo.totalQuestions}개 질문</p>
            <p className="text-blue-600 text-sm">{surveyInfo.personalizedQuestions}</p>
          </div>

          {/* 음성 답변 - 연두색 */}
          <div className="text-center">
            <Mic className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="font-semibold text-green-600 text-lg">{surveyInfo.voiceAnswer}</p>
            <p className="text-green-500 text-sm">{surveyInfo.voiceAnswerDesc}</p>
          </div>

          {/* 약 5분 - 보라(그대로) */}
          <div className="text-center">
            <Clock className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="font-semibold text-purple-800 text-lg">{surveyInfo.estimatedTime}</p>
            <p className="text-purple-600 text-sm">예상 소요 시간</p>
          </div>
        </div>

        {/* Question Preview Section */}
        <div>
          <h2 className="text-2xl font-bold text-purple-800 mb-6 text-left">
            질문 미리보기
          </h2>
          
          <div className="space-y-4">
            {surveyQuestions.map((question, index) => (
              <div
                key={question.id}
                className="relative rounded-lg p-6 shadow-sm"
                style={{ 
                  backgroundColor: question.color,
                  borderLeft: `4px solid ${question.borderColor}`
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl mt-1">
                    {question.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-purple-800 mb-2">
                      질문 {question.id} {question.category}
                    </p>
                    <h3 className="text-lg font-bold text-purple-800 mb-2">
                      {question.title}
                    </h3>
                    <p className="text-purple-600 text-sm">
                      {question.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Start Survey Button */}
        <div className="flex justify-center mt-12">
          <button
            onClick={onStartSurvey}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-8 rounded-lg flex items-center gap-2 transition-colors duration-200 shadow-lg"
          >
            설문 시작하기
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
