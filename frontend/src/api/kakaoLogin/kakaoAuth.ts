import { KakaoPopupResult } from './types';
import { KAKAO_CONFIG } from './config';

/**
 * 백엔드 OAuth2 카카오 로그인 URL 생성
 * Spring Security OAuth2를 사용하는 백엔드 엔드포인트로 리다이렉트
 */
export const generateKakaoAuthURL = (): string => {
  // 환경변수 검증
  if (!KAKAO_CONFIG.API_BASE_URL) {
    console.error('❌ API_BASE_URL이 설정되지 않았습니다.');
    throw new Error('백엔드 URL이 설정되지 않았습니다. 환경변수를 확인해주세요.');
  }
  
  // 백엔드의 OAuth2 엔드포인트 사용
  const backendOAuthURL = `${KAKAO_CONFIG.API_BASE_URL}/oauth2/authorization/kakao`;
  
  console.log('🔍 백엔드 OAuth2 URL:', backendOAuthURL);
  console.log('🔍 KAKAO_CONFIG:', KAKAO_CONFIG);
  
  return backendOAuthURL;
};

/**
 * 카카오 로그인 팝업 창 열기 (백엔드 OAuth2 사용)
 */
export const openKakaoLoginPopup = (): Promise<KakaoPopupResult> => {
  return new Promise((resolve) => {
    try {
      const authURL = generateKakaoAuthURL();
      
      // 팝업 창 크기 및 위치 계산
      const width = 500;
      const height = 600;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      
      // 팝업 창 열기
      const popup = window.open(
        authURL,
        'kakao-login',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      if (!popup) {
        resolve({
          success: false,
          error: '팝업 창을 열 수 없습니다. 팝업 차단을 해제해주세요.'
        });
        return;
      }

      // 팝업 창 상태 체크 인터벌
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          resolve({
            success: false,
            error: '로그인이 취소되었습니다.'
          });
        }
      }, 1000);

      // 메시지 리스너 등록
      const messageListener = (event: MessageEvent) => {
        // 보안을 위해 origin 체크
        if (event.origin !== window.location.origin) {
          return;
        }

        if (event.data.type === 'KAKAO_LOGIN_SUCCESS') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup.close();
          
          resolve({
            success: true,
            data: event.data.payload
          });
        } else if (event.data.type === 'KAKAO_LOGIN_ERROR') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup.close();
          
          resolve({
            success: false,
            error: event.data.error || '로그인 중 오류가 발생했습니다.'
          });
        }
      };

      window.addEventListener('message', messageListener);

      // 타임아웃 설정 (5분)
      setTimeout(() => {
        if (!popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup.close();
          resolve({
            success: false,
            error: '로그인 시간이 초과되었습니다.'
          });
        }
      }, 300000); // 5분

    } catch (error) {
      console.error('카카오 로그인 팝업 오류:', error);
      resolve({
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      });
    }
  });
};

/**
 * 리다이렉트 방식 카카오 로그인 (백엔드 OAuth2 사용)
 */
export const redirectToKakaoLogin = (): void => {
  try {
    const authURL = generateKakaoAuthURL();
    console.log('🚀 카카오 로그인 리다이렉트 시작:', authURL);
    window.location.href = authURL;
  } catch (error) {
    console.error('❌ 카카오 로그인 리다이렉트 오류:', error);
    throw error;
  }
};
