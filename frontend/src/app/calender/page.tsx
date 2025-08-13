"use client"

import { useState, useEffect } from "react"
import { ReminiscenceCalendar } from "@/app/calender/reminiscence-calendar" 
import { ReminiscenceModal } from "@/app/calender/reminiscence-modal"
import { FloatingButtons } from "@/components/common/Floting-Buttons"
import { mockTrainingRecords } from "./dummy-data"

// Define types for key moments and videos
export interface KeyMoment {
  timestamp: string // e.g., "00:30"
  description: string
  videoUrl: string // 영상 URL 추가
  videoId: string // 영상 ID 추가
}

export interface Video {
  id: string
  url: string
  description: string
}

// Define type for question
export interface Question {
  id: string
  type: string // e.g., "기초질문", "개인화질문", "인지자극질문"
  duration: string // e.g., "10분" (for display)
  durationInMinutes: number // e.g., 10 (for calculation)
  questionText: string
  videos: Video[] // Changed from videoUrl to videos array
  keyMoments: KeyMoment[] // 영상의 주요 순간들
  emotionEmoji: string // Changed from overallEmotionIcon to overallEmotionEmoji
  emotionIntensity: number // e.g., 7 (out of 10)
}

// Define type for training record
export interface TrainingRecord {
  date: string // YYYY-MM-DD format
  overallEmotionEmoji: string // Changed from overallEmotionIcon to overallEmotionEmoji
  overallConfidence: number // e.g., 85 (percentage)
  aiInsight: string
  overallIntensity: number // e.g., 8 (out of 10)
  questions: Question[] // Array of detailed question records
}

// 기존 백엔드 API에서 데이터를 가져와서 TrainingRecord로 변환하는 함수
const transformApiDataToTrainingRecord = (apiData: Record<string, unknown>): TrainingRecord => {
  // 기존 백엔드 API 응답 구조에 맞게 변환
  return {
    date: (apiData.date as string) || (apiData.createdAt as string)?.split('T')[0] || new Date().toISOString().split('T')[0],
    overallEmotionEmoji: (apiData.emotionEmoji as string) || "😊",
    overallConfidence: (apiData.confidence as number) || 85,
    aiInsight: (apiData.aiInsight as string) || "회상 훈련을 완료했습니다.",
    overallIntensity: (apiData.intensity as number) || 7,
    questions: (apiData.questions as Question[]) || []
  }
}

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<TrainingRecord | null>(null)
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 기존 백엔드 API에서 회상훈련 기록을 가져오는 함수
  const fetchTrainingRecords = async () => {
    try {
      setIsLoading(true)
      
      // 현재 월의 데이터를 가져오기 위해 날짜 계산
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1
      
      // 기존 백엔드의 월별 캘린더 API 사용
      const response = await fetch(`/api/survey/calendar?year=${year}&month=${month}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.status === 'success' && data.data) {
          // 기존 API 응답을 TrainingRecord 형태로 변환
          const apiRecords = data.data
            .filter((item: { hasData: boolean; calDate?: string; date?: string }) => item.hasData) // 데이터가 있는 날짜만 필터링
            .map((item: { hasData: boolean; calDate?: string; date?: string }) => {
              // 각 날짜에 대해 기본 TrainingRecord 생성
              return {
                date: item.calDate || item.date || new Date().toISOString().split('T')[0],
                overallEmotionEmoji: "😊", // 기본값
                overallConfidence: 85,
                aiInsight: "회상 훈련을 완료했습니다.",
                overallIntensity: 7,
                questions: [
                  {
                    id: "default",
                    type: "기초질문",
                    duration: "5분",
                    durationInMinutes: 5,
                    questionText: "오늘의 회상 훈련을 완료했습니다.",
                    videos: [
                      {
                        id: "default-video",
                        url: "/placeholder.svg?height=100&width=150",
                        description: "회상 훈련 영상"
                      }
                    ],
                    keyMoments: [],
                    emotionEmoji: "😊",
                    emotionIntensity: 7
                  }
                ]
              }
            })
          
          // API 데이터와 더미 데이터를 합침 (더미 데이터가 우선)
          const combinedRecords = [...mockTrainingRecords, ...apiRecords]
          // 중복 날짜 제거 (더미 데이터 우선)
          const uniqueRecords = combinedRecords.filter((record, index, self) => 
            index === self.findIndex(r => r.date === record.date)
          )
          
          setTrainingRecords(uniqueRecords)
        } else {
          // API 호출 실패 시 더미 데이터만 사용
          setTrainingRecords(mockTrainingRecords)
        }
      } else {
        console.error('Failed to fetch training records')
        // API 호출 실패 시 더미 데이터만 사용
        setTrainingRecords(mockTrainingRecords)
      }
    } catch (error) {
      console.error('Error fetching training records:', error)
      // 에러 발생 시 더미 데이터만 사용
      setTrainingRecords(mockTrainingRecords)
    } finally {
      setIsLoading(false)
    }
  }

  // 컴포넌트 마운트 시 데이터 가져오기
  useEffect(() => {
    fetchTrainingRecords()
  }, [])

  const handleDateClick = (record: TrainingRecord) => {
    setSelectedRecord(record)
    setIsModalOpen(true)
  }

  return (
    <>
      <main className="flex max-h-218 flex-col items-center justify-center p-4 md:p-8 bg-blue-50">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-gray-800" style={{fontFamily: 'Paperlogy'}}>회상 기록 달력</h1>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">데이터를 불러오는 중...</span>
          </div>
        ) : (
          <ReminiscenceCalendar trainingRecords={trainingRecords} onDateClick={handleDateClick} />
        )}
        
        {selectedRecord && (
          <ReminiscenceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} record={selectedRecord} />
        )}
      </main>
      <FloatingButtons />
    </>
  )
}
