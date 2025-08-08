// 카카오 로그인 설정 상수
export const KAKAO_CONFIG = {
  CLIENT_ID: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || 'a566d8cd4e310decaf7bc6f4b5dee2e0',
  REDIRECT_URI: process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI || 'http://localhost:3000/auth/kakao/callback',
  API_BASE_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8088'
} as const;
