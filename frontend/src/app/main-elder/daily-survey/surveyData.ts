import { useEffect, useState } from 'react';
import { Question } from './types';
import { useSurveyQuestionsContext } from './SurveyQuestionsContext';
import type { ApiResponse } from '@/lib/api';

// 더미 데이터 제거: 서버 응답을 기반으로 UI 메타데이터만 부여하여 구성합니다.
const CATEGORY_BY_INDEX = ["일일 설문", "기억 및 인지", "관심사 및 취미"] as const;
const ICON_BY_INDEX = ["😊", "🧠", "❤️"] as const;
const COLOR_BY_INDEX = ["#E3F2FD", "#E8F5E8", "#F3E5F5"] as const;
const BORDER_COLOR_BY_INDEX = ["#2196F3", "#4CAF50", "#9C27B0"] as const;
const DEFAULT_DESCRIPTION = "준비가 완료되면 답변하기 버튼을 눌러 대답해주세요.";

export const surveyInfo = {
  estimatedTime: "약 5분",
  estimatedTimeMinutes: 5,
  voiceAnswer: "음성 답변",
  voiceAnswerDesc: "자연스러운 음성 응답",
  personalizedQuestions: "개인화된 맞춤 질문"
};

// 서버 응답 타입
interface ServerSurveyQuestion {
  questionId: number;
  content: string;
  createdAt?: string;
}
// export const SURVEY_API_URL = 'https://recode-my-life.site/api/survey/questions';
export const SURVEY_API_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088'}/api/survey/questions`;

// 서버에서 질문을 가져오되, 쿠키 세션을 포함해 요청
export async function fetchSurveyQuestionsWithCredentials(): Promise<ServerSurveyQuestion[]> {
  const res = await fetch(SURVEY_API_URL, {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`설문 API 오류: ${res.status}`);
  }

  const json = (await res.json()) as ApiResponse<ServerSurveyQuestion[]>;
  if (json.status !== 'success' || json.code !== 200 || !Array.isArray(json.data)) {
    throw new Error('설문 API 응답 형식이 올바르지 않습니다');
  }
  return json.data;
}

// 서버 질문의 content를 기존 더미 질문의 title에 매핑
export function mapServerTitlesToLocalQuestions(base: Question[], server: ServerSurveyQuestion[]): Question[] {
  // 사용하지 않음: 더미 데이터 제거로 인해 base가 존재하지 않습니다.
  // 하위 호환을 위해 서버에서 직접 생성하도록 위임합니다.
  return buildQuestionsFromServer(server);
}

export function buildQuestionsFromServer(server: ServerSurveyQuestion[]): Question[] {
  return server.map((item, idx) => {
    const metaIndex = idx % CATEGORY_BY_INDEX.length;
    return {
      id: item.questionId,
      category: CATEGORY_BY_INDEX[metaIndex],
      title: item.content,
      description: DEFAULT_DESCRIPTION,
      icon: ICON_BY_INDEX[metaIndex],
      color: COLOR_BY_INDEX[metaIndex],
      borderColor: BORDER_COLOR_BY_INDEX[metaIndex],
    };
  });
}

// 클라이언트 훅: 서버에서 제목만 가져와 교체 (description 등은 유지)
export function useDailySurveyQuestions() {
  // 상위 컨텍스트가 있으면 우선 사용
  const ctx = useSurveyQuestionsContext();
  const [questions, setQuestions] = useState<Question[]>(ctx?.questions ?? []);
  const [isLoading, setIsLoading] = useState<boolean>(ctx?.isLoading ?? true);
  const [error, setError] = useState<string | null>(ctx?.error ?? null);

  useEffect(() => {
    // 컨텍스트가 제공되면 자체 로딩을 하지 않음
    if (ctx) {
      setQuestions(ctx.questions);
      setIsLoading(ctx.isLoading);
      setError(ctx.error);
      return;
    }
    let isMounted = true;
    const load = async () => {
      try {
        setError(null);
        const server = await fetchSurveyQuestionsWithCredentials();
        if (!isMounted) return;
        setQuestions(buildQuestionsFromServer(server));
      } catch (error: unknown) {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : '설문 질문을 불러오지 못했습니다';
        setError(message);
        setQuestions([]); // 실패 시 빈 배열 유지
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [ctx]);

  return { questions, isLoading, error };
}
