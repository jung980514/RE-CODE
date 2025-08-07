import { Question } from './types';

export const surveyQuestions: Question[] = [
  {
    id: 1,
    category: "일일 설문",
    title: "오늘의 기분과 컨디션은 어떠신가요?",
    description: "준비가 완료 되면 답변 버튼을 눌러 대답해주세요.",
    icon: "😊",
    color: "#E3F2FD", // 연한 파란색 배경
    borderColor: "#2196F3" // 파란색 테두리
  },
  {
    id: 2,
    category: "일일 설문",
    title: "최근 기억에 관한 경험을 들려주세요",
    description: "준비가 완료 되면 답변 버튼을 눌러 대답해주세요.",
    icon: "🧠",
    color: "#E8F5E8", // 연한 초록색 배경
    borderColor: "#4CAF50" // 초록색 테두리
  },
  {
    id: 3,
    category: "일일 설문",
    title: "요즘 관심 있는 활동이나 취미가 있나요?",
    description: "준비가 완료 되면 답변 버튼을 눌러 대답해주세요.",
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
