// 카카오 로그인 설정 상수
export const KAKAO_CONFIG = {
  CLIENT_ID: NEXT_PUBLIC_KAKAO_CLIENT_ID || '',
  REDIRECT_URI: NEXT_PUBLIC_KAKAO_REDIRECT_URI || '',
  // API_BASE_URL: NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8088'
  API_BASE_URL: NEXT_PUBLIC_BACKEND_URL || 'https://recode-my-life.site'
} as const;

// 환경변수 로딩 확인을 위한 디버깅
console.log('🔍 KAKAO_CONFIG 로딩:', {
  CLIENT_ID: KAKAO_CONFIG.CLIENT_ID,
  REDIRECT_URI: KAKAO_CONFIG.REDIRECT_URI,
  API_BASE_URL: KAKAO_CONFIG.API_BASE_URL
});
