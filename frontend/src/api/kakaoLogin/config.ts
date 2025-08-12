// 카카오 로그인 설정 상수
export const KAKAO_CONFIG = {
  CLIENT_ID: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID,
  REDIRECT_URI: process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI,
  API_BASE_URL: process.env.NEXT_PUBLIC_BACKEND_URL
} as const;
