// 카카오 로그인 관련 타입 정의

export interface KakaoUser {
  id: number;
  email: string;
  name: string;
  role: 'ELDER' | 'GUARDIAN' | 'USER';
}

export interface KakaoLoginResponse {
  success: boolean;
  status: 'success' | 'error';
  message?: string;
  error?: string;
  user?: KakaoUser;
  token?: string;
  needsSetup?: boolean; // 최초 로그인 시 설문조사 필요 여부
}

export interface KakaoAuthCodeResponse {
  code: string;
  state?: string;
  error?: string;
  error_description?: string;
}

export interface KakaoPopupResult {
  success: boolean;
  data?: KakaoAuthCodeResponse;
  error?: string;
}

// 설문조사 데이터 타입
export interface SurveyData {
  role: 'ELDER' | 'GUARDIAN';
  additionalInfo?: Record<string, unknown>; // 추가 정보
}

// 카카오 API 응답 타입
export interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
}

export interface KakaoUserInfo {
  id: number;
  connected_at: string;
  properties?: {
    nickname?: string;
    profile_image?: string;
    thumbnail_image?: string;
  };
  kakao_account?: {
    profile_nickname_needs_agreement?: boolean;
    profile_image_needs_agreement?: boolean;
    profile?: {
      nickname?: string;
      thumbnail_image_url?: string;
      profile_image_url?: string;
    };
    has_email?: boolean;
    email_needs_agreement?: boolean;
    is_email_valid?: boolean;
    is_email_verified?: boolean;
    email?: string;
  };
}
