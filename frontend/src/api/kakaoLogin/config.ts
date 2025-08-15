// 카카오 로그인 설정 상수
export const KAKAO_CONFIG = {
  CLIENT_ID: process.env.KAKAO_CLIENT_ID || '',
  REDIRECT_URI: process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI || '',
  // 환경변수에서 백엔드 URL을 가져옴
  API_BASE_URL: process.env.NEXT_PUBLIC_BACKEND_URL || ''
} as const;

// 환경변수 로딩 확인을 위한 디버깅
console.log('🔍 KAKAO_CONFIG 로딩:', {
  CLIENT_ID: KAKAO_CONFIG.CLIENT_ID,
  REDIRECT_URI: KAKAO_CONFIG.REDIRECT_URI,
  API_BASE_URL: KAKAO_CONFIG.API_BASE_URL,
  // 환경변수 직접 확인
  ENV_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  NODE_ENV: process.env.NODE_ENV
});
