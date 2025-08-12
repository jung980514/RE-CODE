// 로그인 상태 및 사용자 타입 확인 유틸리티

export const isLoggedIn = (): boolean => {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('role');
  return !!token;
};

export const getRole = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('role');
};

export const isElderUser = (): boolean => {
  const role = getRole();
  return role === 'ELDER';
};

export const isGuardianUser = (): boolean => {
  const role = getRole();
  return role === 'GUARDIAN';
};

export const logout = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('userEmail');
}; 

// 일일 설문조사 완료 상태 관리
export const setDailySurveyCompleted = (userId: string) => {
  try {
    if (typeof window !== 'undefined') {
      const today = new Date().toDateString();
      const surveyData = JSON.parse(localStorage.getItem('dailySurveyData') || '{}');
      surveyData[userId] = {
        completed: true,
        completedAt: today
      };
      localStorage.setItem('dailySurveyData', JSON.stringify(surveyData));
    }
  } catch (error) {
    console.error('Failed to set daily survey completion status:', error);
  }
};

export const isDailySurveyCompleted = (userId: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  const today = new Date().toDateString();
  const surveyData = JSON.parse(localStorage.getItem('dailySurveyData') || '{}');
  const userData = surveyData[userId];
  
  return userData?.completed && userData?.completedAt === today;
};

export const getCurrentUserId = (): string | null => {
  try {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('userId');
  } catch {
    return null;
  }
}; 

// Recall Training 세션 완료 상태 관리
export const RECALL_TRAINING_SESSIONS = {
  memory: 'memory',      // 기억 꺼내기
  story: 'story',        // 이야기 나누기
  music: 'music',        // 들려오는 추억
  photo: 'photo'         // 추억의 시대
} as const

export type RecallTrainingSession = typeof RECALL_TRAINING_SESSIONS[keyof typeof RECALL_TRAINING_SESSIONS]

export function getCompletedRecallTrainingSessions(): RecallTrainingSession[] {
  if (typeof window === 'undefined') return []
  
  const completed = localStorage.getItem('completedRecallTrainingSessions')
  return completed ? JSON.parse(completed) : []
}

export function markRecallTrainingSessionAsCompleted(sessionId: RecallTrainingSession) {
  if (typeof window === 'undefined') return
  
  const completed = getCompletedRecallTrainingSessions()
  if (!completed.includes(sessionId)) {
    completed.push(sessionId)
    localStorage.setItem('completedRecallTrainingSessions', JSON.stringify(completed))
  }
}

export function isRecallTrainingSessionCompleted(sessionId: RecallTrainingSession): boolean {
  const completed = getCompletedRecallTrainingSessions()
  return completed.includes(sessionId)
}

export function getIncompleteRecallTrainingSessions(): RecallTrainingSession[] {
  const allSessions = Object.values(RECALL_TRAINING_SESSIONS)
  const completed = getCompletedRecallTrainingSessions()
  return allSessions.filter(session => !completed.includes(session))
}

export function clearRecallTrainingProgress() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('completedRecallTrainingSessions')
} 