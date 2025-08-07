"use client"

import { useState } from "react"
import { ReminiscenceCalendar } from "@/app/calender/reminiscence-calendar" 
import { ReminiscenceModal } from "@/app/calender/reminiscence-modal"
import { FloatingButtons } from "@/components/common/Floting-Buttons"

// Define types for key moments and videos
export interface KeyMoment {
  timestamp: string // e.g., "00:30"
  description: string
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
  keyMoments: KeyMoment[]
  emotionEmoji: string // Changed from emotionIcon to emotionEmoji
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

// Mock data for demonstration, updated to match the image structure and new video/duration requirements
const mockTrainingRecords: TrainingRecord[] = [
  {
    date: "2025-08-01",
    overallEmotionEmoji: "😊",
    overallConfidence: 90,
    aiInsight: "상쾌한 아침 산책과 명상으로 하루를 긍정적으로 시작했습니다.",
    overallIntensity: 9,
    questions: [
      {
        id: "q1",
        type: "기초질문",
        duration: "5분",
        durationInMinutes: 5,
        questionText: "오늘 아침에 무엇을 드셨나요?",
        videos: [
          { id: "v1-1", url: "/placeholder.svg?height=100&width=150", description: "식사 내용 회상 영상 1" },
        ],
        keyMoments: [
          { timestamp: "00:30", description: "식사 내용을 기억하려고 노력하는 모습" },
          { timestamp: "00:30", description: "식사 내용을 기억하려고 노력하는 모습" },
          { timestamp: "00:30", description: "식사 내용을 기억하려고 노력하는 모습" },
        ],
        emotionEmoji: "😊",
        emotionIntensity: 7,
      },
      {
        id: "q2",
        type: "개인화질문",
        duration: "10분",
        durationInMinutes: 5,
        questionText: "복날인데 왜 등산을 가셧어요?",
        videos: [
          { id: "v1-1", url: "/placeholder.svg?height=100&width=150", description: "식사 내용 회상 영상 1" },
        ],
        keyMoments: [
          { timestamp: "00:30", description: "식사 내용을 기억하려고 노력하는 모습" },
          { timestamp: "00:30", description: "식사 내용을 기억하려고 노력하는 모습" },
          { timestamp: "00:30", description: "식사 내용을 기억하려고 노력하는 모습" },
        ],
        emotionEmoji: "😊",
        emotionIntensity: 7,
      },
      {
        id: "q3",
        type: "이 소리를 보고 떠오르는게 있나요?",
        duration: "10분",
        durationInMinutes: 10,
        questionText: "오늘 아침에 무엇을 드셨나요?",
        videos: [
          { id: "v1-2", url: "/placeholder.svg?height=100&width=150", description: "아침 식사 준비 영상 2" },
        ],
        keyMoments: [
          { timestamp: "00:30", description: "식사 내용을 기억하려고 노력하는 모습" },
          { timestamp: "00:30", description: "식사 내용을 기억하려고 노력하는 모습" },
          { timestamp: "00:30", description: "식사 내용을 기억하려고 노력하는 모습" },
        ],
        emotionEmoji: "😊",
        emotionIntensity: 7,
      },
    ],
  },
  {
    date: "2025-08-08", // Example date matching the image
    overallEmotionEmoji: "😠", // Example: Frown for the overall emotion
    overallConfidence: 85,
    aiInsight: "오늘은 기억을 되찾는 과정에서 약간의 좌절감을 보였지만, 점차 안정을 찾아가는 모습을 보였습니다.",
    overallIntensity: 8,
    questions: [
      {
        id: "q2",
        type: "기초질문",
        duration: "10분",
        durationInMinutes: 10,
        questionText: "오늘 아침에 무엇을 드셨나요?",
        videos: [
          { id: "v2-1", url: "/placeholder.svg?height=100&width=150", description: "식사 내용 회상 영상 1" },
        ],
        keyMoments: [
          { timestamp: "00:30", description: "식사 내용을 기억하려고 노력하는 모습" },
        ],
        emotionEmoji: "😠",
        emotionIntensity: 7,
      },
      {
        id: "q3",
        type: "개인화질문",
        duration: "12분",
        durationInMinutes: 12,
        questionText: "가장 기억에 남는 가족 여행은 언제였나요?",
        videos: [
          { id: "v3-1", url: "/placeholder.svg?height=100&width=150", description: "가족 여행 회상 영상 1" },
        ],
        keyMoments: [
          { timestamp: "01:00", description: "과거 여행을 회상하며 미소 짓는 모습" },
        ],
        emotionEmoji: "😔",
        emotionIntensity: 6,
      },
      {
        id: "q4",
        type: "인지자극질문",
        duration: "8분",
        durationInMinutes: 8,
        questionText: "이 음악을 들으면 어떤 기분이 드시나요?",
        videos: [{ id: "v4-1", url: "/placeholder.svg?height=100&width=150", description: "음악 감상 영상 1" }],
        keyMoments: [
          { timestamp: "00:45", description: "음악에 집중하는 모습" },
        ],
        emotionEmoji: "😊",
        emotionIntensity: 5,
      },
    ],
  },
]

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<TrainingRecord | null>(null)

  const handleDateClick = (record: TrainingRecord) => {
    setSelectedRecord(record)
    setIsModalOpen(true)
  }

  return (
    <>
      <main className="flex max-h-218 flex-col items-center justify-center p-4 md:p-8 bg-blue-50">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-gray-800" style={{fontFamily: 'Paperlogy'}}>회상 기록 달력</h1>
        <ReminiscenceCalendar trainingRecords={mockTrainingRecords} onDateClick={handleDateClick} />
        {selectedRecord && (
          <ReminiscenceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} record={selectedRecord} />
        )}
      </main>
      <FloatingButtons />
    </>
  )
}
