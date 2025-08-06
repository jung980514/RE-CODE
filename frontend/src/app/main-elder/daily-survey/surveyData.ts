import { Question } from './types';

export const surveyQuestions: Question[] = [
  {
    id: 1,
    category: "기분 및 컨디션",
    title: "오늘의 기분과 컨디션은 어떠신가요?",
    description: "현재 기분 상태, 체력 수준, 전반적인 컨디션에 대해 자유롭게 말씀해 주세요.",
    icon: "😊",
    color: "#E3F2FD", // 연한 파란색 배경
    borderColor: "#2196F3" // 파란색 테두리
  },
  {
    id: 2,
    category: "기억 및 인지",
    title: "최근 기억에 관한 경험을 들려주세요",
    description: "어제나 최근 며칠간 기억에 남는 일, 잊어버린 것이 있다면 어떤 것인지 말씀해 주세요.",
    icon: "🧠",
    color: "#E8F5E8", // 연한 초록색 배경
    borderColor: "#4CAF50" // 초록색 테두리
  },
  {
    id: 3,
    category: "관심사 및 취미",
    title: "요즘 관심 있는 활동이나 취미가 있나요?",
    description: "현재 즐기고 있는 활동, 새로 시작하고 싶은 것, 또는 과거에 좋아했던 취미에 대해 말씀해 주세요.",
    icon: "❤️",
    color: "#F3E5F5", // 연한 보라색 배경
    borderColor: "#9C27B0" // 보라색 테두리
  }
];

export const surveyInfo = {
  totalQuestions: 3,
  estimatedTime: "약 5분",
  estimatedTimeMinutes: 5,
  voiceAnswer: "음성 답변",
  voiceAnswerDesc: "자연스러운 음성 응답",
  personalizedQuestions: "개인화된 맞춤 질문"
};
