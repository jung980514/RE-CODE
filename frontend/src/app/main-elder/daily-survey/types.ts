export interface Question {
  id: number;
  category: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  borderColor: string;
}

export interface SurveyProgress {
  currentQuestion: number;
  totalQuestions: number;
  completedQuestions: number[];
  estimatedTimeRemaining: string;
}

export interface VoiceRecording {
  isRecording: boolean;
  isRecorded: boolean;
  audioUrl?: string;
  duration?: number;
}

export interface SurveyState {
  currentStep: 'intro' | 'first-question' | 'form' | 'complete';
  currentQuestionIndex: number;
  recordings: Record<number, VoiceRecording>;
  progress: SurveyProgress;
}

export interface SurveyIntroProps {
  onStartSurvey: () => void;
}

export interface SurveyFirstQuestionProps {
  onStartRecording: () => void;
  onBack: () => void;
}

export interface SurveyQuestionProps {
  questionIndex: number;
  onNext: () => void;
  onBack: () => void;
  onComplete: () => void;
  isLastQuestion: boolean;
}

export interface SurveyFormProps {
  onComplete: () => void;
  onBack: () => void;
}

export interface SurveyCompleteModalProps {
  isOpen: boolean;
  onConfirm: () => void;
} 