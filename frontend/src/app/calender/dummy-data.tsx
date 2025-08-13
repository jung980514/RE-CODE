// 캘린더용 더미 데이터
import type { TrainingRecord } from "./page"

export const mockTrainingRecords: TrainingRecord[] = [
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
          { 
            timestamp: "00:30", 
            description: "식사 내용 회상 영상 1",
            videoUrl: "/placeholder.svg?height=100&width=150",
            videoId: "km1-1"
          },
          { 
            timestamp: "01:15", 
            description: "식사 내용을 기억하려고 노력하는 모습",
            videoUrl: "/placeholder.svg?height=100&width=150",
            videoId: "km1-2"
          },
          { 
            timestamp: "02:00", 
            description: "아침 식사 메뉴를 상세히 회상하는 모습",
            videoUrl: "/placeholder.svg?height=100&width=150",
            videoId: "km1-3"
          },
          { 
            timestamp: "02:45", 
            description: "식사 후 기분과 만족도 표현",
            videoUrl: "/placeholder.svg?height=100&width=150",
            videoId: "km1-4"
          },
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
          { 
            timestamp: "00:30", 
            description: "등산 계획을 세우는 모습",
            videoUrl: "/placeholder.svg?height=100&width=150",
            videoId: "km2-1"
          },
          { 
            timestamp: "01:20", 
            description: "등산 준비물을 챙기는 모습",
            videoUrl: "/placeholder.svg?height=100&width=150",
            videoId: "km2-2"
          },
          { 
            timestamp: "02:10", 
            description: "등산로에서 힘들어하는 모습",
            videoUrl: "/placeholder.svg?height=100&width=150",
            videoId: "km2-3"
          },
          { 
            timestamp: "03:00", 
            description: "정상에서 기뻐하는 모습",
            videoUrl: "/placeholder.svg?height=100&width=150",
            videoId: "km2-4"
          },
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
          { 
            timestamp: "00:30", 
            description: "음악을 듣고 집중하는 모습",
            videoUrl: "/placeholder.svg?height=100&width=150",
            videoId: "km3-1"
          },
          { 
            timestamp: "01:15", 
            description: "음악에 맞춰 몸을 움직이는 모습",
            videoUrl: "/placeholder.svg?height=100&width=150",
            videoId: "km3-2"
          },
          { 
            timestamp: "02:00", 
            description: "음악을 들으며 미소 짓는 모습",
            videoUrl: "/placeholder.svg?height=100&width=150",
            videoId: "km3-3"
          },
        ],
        emotionEmoji: "😊",
        emotionIntensity: 7,
      },
    ],
  },
  {
    date: "2025-08-08",
    overallEmotionEmoji: "😠",
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
          { 
            timestamp: "00:30", 
            description: "아침 식사 메뉴를 생각하는 모습",
            videoUrl: "/placeholder.svg?height=100&width=150",
            videoId: "km3-1"
          },
          { 
            timestamp: "01:00", 
            description: "식사 시간을 기억하려고 노력하는 모습",
            videoUrl: "/placeholder.svg?height=100&width=150",
            videoId: "km3-2"
          },
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
          { 
            timestamp: "01:00", 
            description: "과거 여행을 회상하며 미소 짓는 모습",
            videoUrl: "/placeholder.svg?height=100&width=150",
            videoId: "km4-1"
          },
          { 
            timestamp: "02:00", 
            description: "여행지에서 찍은 사진을 보며 추억하는 모습",
            videoUrl: "/placeholder.svg?height=100&width=150",
            videoId: "km4-2"
          },
          { 
            timestamp: "03:00", 
            description: "가족들과 함께한 순간을 회상하는 모습",
            videoUrl: "/placeholder.svg?height=100&width=150",
            videoId: "km4-3"
          },
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
          { 
            timestamp: "00:45", 
            description: "음악에 집중하는 모습",
            videoUrl: "/placeholder.svg?height=100&width=150",
            videoId: "km5-1"
          },
          { 
            timestamp: "01:30", 
            description: "음악을 들으며 감정을 표현하는 모습",
            videoUrl: "/placeholder.svg?height=100&width=150",
            videoId: "km5-2"
          },
        ],
        emotionEmoji: "😊",
        emotionIntensity: 5,
      },
    ],
  },
  // 오늘 날짜(8월 14일) 더미 데이터 추가
  {
    date: "2025-08-14",
    overallEmotionEmoji: "😊",
    overallConfidence: 88,
    aiInsight: "오늘은 회상 훈련을 성공적으로 완료했습니다. 기억력과 집중력이 향상되고 있습니다.",
    overallIntensity: 8,
    questions: [
      {
        id: "q5",
        type: "기초질문",
        duration: "6분",
        durationInMinutes: 6,
        questionText: "오늘 점심에 무엇을 드셨나요?",
        videos: [
          { id: "v5-1", url: "/placeholder.svg?height=100&width=150", description: "점심 식사 회상 영상" },
        ],
        keyMoments: [
          { 
            timestamp: "00:20", 
            description: "점심에 빵을 먹었는지 회상하는 모습",
            videoUrl: "/placeholder.svg?height=100&width=150",
            videoId: "km6-1"
          },
          { 
            timestamp: "00:45", 
            description: "점심에 디저트를 먹었는지 회상하는 모습",
            videoUrl: "/placeholder.svg?height=100&width=150",
            videoId: "km6-2"
          },
          { 
            timestamp: "01:10", 
            description: "점심 식사 장소를 기억하려고 노력하는 모습",
            videoUrl: "/placeholder.svg?height=100&width=150",
            videoId: "km6-3"
          },
          { 
            timestamp: "01:35", 
            description: "점심 후 기분과 만족도를 표현하는 모습",
            videoUrl: "/placeholder.svg?height=100&width=150",
            videoId: "km6-4"
          },
        ],
        emotionEmoji: "😊",
        emotionIntensity: 8,
      },
      {
        id: "q6",
        type: "개인화질문",
        duration: "8분",
        durationInMinutes: 8,
        questionText: "가장 좋아하는 계절은 언제인가요?",
        videos: [
          { id: "v6-1", url: "/placeholder.svg?height=100&width=150", description: "계절 선호도 질문 영상" },
        ],
        keyMoments: [
          { 
            timestamp: "00:30", 
            description: "계절을 생각하며 미소 짓는 모습",
            videoUrl: "/placeholder.svg?height=100&width=150",
            videoId: "km7-1"
          },
          { 
            timestamp: "01:00", 
            description: "좋아하는 계절의 이유를 설명하는 모습",
            videoUrl: "/placeholder.svg?height=100&width=150",
            videoId: "km7-2"
          },
          { 
            timestamp: "01:30", 
            description: "해당 계절의 추억을 회상하는 모습",
            videoUrl: "/placeholder.svg?height=100&width=150",
            videoId: "km7-3"
          },
        ],
        emotionEmoji: "😊",
        emotionIntensity: 7,
      },
      {
        id: "q7",
        type: "이 소리를 보고 떠오르는게 있나요?",
        duration: "7분",
        durationInMinutes: 7,
        questionText: "이 음악을 들으면 어떤 기억이 떠오르나요?",
        videos: [
          { id: "v7-1", url: "/placeholder.svg?height=100&width=150", description: "음악 감상 회상 영상" },
        ],
        keyMoments: [
          { 
            timestamp: "00:25", 
            description: "음악에 집중하는 모습",
            videoUrl: "/placeholder.svg?height=100&width=150",
            videoId: "km8-1"
          },
          { 
            timestamp: "00:50", 
            description: "과거 기억을 회상하는 모습",
            videoUrl: "/placeholder.svg?height=100&width=150",
            videoId: "km8-2"
          },
          { 
            timestamp: "01:15", 
            description: "음악과 관련된 감정을 표현하는 모습",
            videoUrl: "/placeholder.svg?height=100&width=150",
            videoId: "km8-3"
          },
          { 
            timestamp: "01:40", 
            description: "음악을 들으며 추억을 정리하는 모습",
            videoUrl: "/placeholder.svg?height=100&width=150",
            videoId: "km8-4"
          },
        ],
        emotionEmoji: "😊",
        emotionIntensity: 8,
      },
    ],
  },
]
