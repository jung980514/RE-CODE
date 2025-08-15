import axios from 'axios';
import { redirectToKakaoLogin } from './kakaoAuth';
import { KakaoLoginResponse, SurveyData } from './types';
import { KAKAO_CONFIG } from './config';

// 회원정보(설문) 업데이트 API
export const updateUserInfo = async (surveyData: SurveyData) => {
  try {
    const response = await axios.patch(`${KAKAO_CONFIG.API_BASE_URL}/api/user/update`, surveyData, { withCredentials: true });
    return {
      success: response.data.status === 'success',
      user: response.data.data,
      error: response.data.message || null,
    };
  } catch (error: unknown) {
    let errMsg = '설정 저장 중 오류가 발생했습니다.';
    if (axios.isAxiosError(error)) {
      errMsg = error.response?.data?.message || error.message || errMsg;
    }
    return {
      success: false,
      user: null,
      error: errMsg,
    };
  }
};

/**
 * 카카오 로그인 메인 함수 (백엔드 OAuth2 사용)
 * @param usePopup - true: 팝업 방식, false: 리다이렉트 방식
 */
export const kakaoLogin = async (usePopup: boolean = false): Promise<KakaoLoginResponse> => {
  try {
    console.log('🎯 kakaoLogin 함수 시작, usePopup:', usePopup);
    
    if (usePopup) {
      // 팝업 방식은 복잡하므로 일단 리다이렉트 방식 사용
      console.log('📱 팝업 방식 요청됨 - 리다이렉트로 변경');
      redirectToKakaoLogin();
      return {
        success: true,
        status: 'success',
        message: '카카오 로그인 페이지로 이동 중...'
      };
    } else {
      redirectToKakaoLogin();
      return {
        success: true,
        status: 'success',
        message: '카카오 로그인 페이지로 이동 중...'
      };
    }
  } catch (error) {
    console.error('❌ 카카오 로그인 오류:', error);
    return {
      success: false,
      status: 'error',
      error: error instanceof Error ? error.message : '카카오 로그인 중 오류가 발생했습니다.'
    };
  }
};

// 카카오 콜백 처리 함수
export const handleKakaoCallback = async (): Promise<KakaoLoginResponse> => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    
    if (errorParam) {
      console.log('❌ URL에서 OAuth2 에러 감지:', errorParam);
      return {
        success: false,
        status: 'error',
        error: `OAuth2 인증 오류: ${errorParam}`
      };
    }

    // 🔍 쿠키 디버깅: 현재 페이지의 모든 쿠키 확인
    console.log('🍪 현재 페이지 쿠키 확인:');
    console.log('🍪 document.cookie:', document.cookie);
    console.log('🍪 현재 도메인:', window.location.hostname);
    console.log('🍪 현재 프로토콜:', window.location.protocol);
    
    // 특정 쿠키들 확인
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    console.log('🍪 파싱된 쿠키들:', cookies);
    console.log('🍪 access_token 쿠키:', cookies['access_token']);
    console.log('🍪 refresh_token 쿠키:', cookies['refresh_token']);
    console.log('🍪 uuid 쿠키:', cookies['uuid']);

    // 백엔드에서 설정한 쿠키에서 사용자 정보 확인
    const response = await axios.get(`${KAKAO_CONFIG.API_BASE_URL}/api/user`, {
      withCredentials: true // 쿠키 포함
    });

    console.log('📡 백엔드 응답:', response.data);
    const apiResponse = response.data;

    if (apiResponse.status === 'success' && apiResponse.data) {
      const userData = apiResponse.data;
      console.log('👤 사용자 데이터:', userData);

      // 사용자 역할 저장 (백엔드 Role enum 기반)
      const role = userData.role;
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('role', role);
      localStorage.setItem('name', userData.name || '');
      localStorage.setItem('userId', userData.id || '');

      // 로그인 성공 후 일일 설문 완료 여부 조회 → 로컬스토리지 플래그 저장
      try {
        const dailySurveyResp = await axios.get(`${KAKAO_CONFIG.API_BASE_URL}/api/user/daily-survey`, {
          withCredentials: true
        });
        if (dailySurveyResp.status === 200) {
          const json = dailySurveyResp.data;
          let isCompleted = false;
          if (typeof json === 'boolean') {
            isCompleted = json;
          } else if (typeof json === 'string') {
            isCompleted = json === 'true';
          } else if (typeof json === 'object' && json !== null) {
            const root = json as Record<string, unknown>;
            const direct = root['data'];
            if (typeof direct === 'boolean') {
              isCompleted = direct;
            } else if (typeof direct === 'string') {
              isCompleted = direct === 'true';
            }
          }
          localStorage.setItem('isdailysurveycompleted', isCompleted ? '1' : '0');
        } else {
          localStorage.setItem('isdailysurveycompleted', '0');
        }
      } catch (e) {
        console.error('일일 설문 완료 여부 조회 실패:', e);
        try { localStorage.setItem('isdailysurveycompleted', '0'); } catch {}
      }

      // 로그인 성공 후 회상훈련 상태 조회 → 로컬스토리지에 저장
      try {
        const statusResp = await axios.get(`${KAKAO_CONFIG.API_BASE_URL}/api/user/status`, {
          withCredentials: true
        });
        if (statusResp.status === 200) {
          const json = statusResp.data;
          let statusData: { basic?: boolean; personal?: boolean; cognitiveAudio?: boolean; cognitiveImage?: boolean } = {};
          
          if (typeof json === 'object' && json !== null) {
            const root = json as Record<string, unknown>;
            const direct = root['data'];
            if (typeof direct === 'object' && direct !== null) {
              statusData = direct as { basic?: boolean; personal?: boolean; cognitiveAudio?: boolean; cognitiveImage?: boolean };
            }
          }
          
          // 회상훈련 세션 상태를 localStorage에 저장
          const completed: string[] = [];
          if (statusData.basic) completed.push('memory');
          if (statusData.personal) completed.push('story');
          if (statusData.cognitiveAudio) completed.push('music');
          if (statusData.cognitiveImage) completed.push('photo');
          
          localStorage.setItem('completedRecallTrainingSessions', JSON.stringify(completed));
          console.log('카카오 로그인 - 회상훈련 상태 저장 완료:', completed);
        } else {
          localStorage.setItem('completedRecallTrainingSessions', JSON.stringify([]));
        }
      } catch (e) {
        console.error('카카오 로그인 - 회상훈련 상태 조회 실패:', e);
        try { localStorage.setItem('completedRecallTrainingSessions', JSON.stringify([])); } catch {}
      }

      // 최초 로그인 사용자인 경우 설문조사 완료 여부 확인
      if (role === 'USER') {
        // 카카오 설문조사 완료 여부 확인 (이메일별)
        const userEmail = userData.email?.replace('kakao ', '') || 'unknown';
        const surveyCompleted = localStorage.getItem(`kakao_survey_completed_${userEmail}`) === 'true';

        console.log('🔍 설문조사 완료 여부 확인:', {
          userEmail,
          surveyCompleted
        });

        if (!surveyCompleted) {
          // 설문조사 미완료 - 카카오 정보를 설문조사에서 사용할 수 있도록 저장
          localStorage.setItem('kakaoUserInfo', JSON.stringify({
            id: userData.id,
            name: userData.name,
            email: userData.email
          }));
          console.log('⚠️ 설문조사 필요한 사용자');
        } else {
          // 🔥 이미 설문조사를 완료한 카카오 사용자
          // localStorage에서 이전에 설정한 역할을 가져와서 사용
          const savedRole = localStorage.getItem(`kakao_role_${userEmail}`);
          if (savedRole && (savedRole === 'ELDER' || savedRole === 'GUARDIAN')) {
            console.log('✅ 이전에 설정한 역할 발견:', savedRole);
            localStorage.setItem('role', savedRole);
            
            // 이미 역할이 설정된 사용자의 경우 회상훈련 상태도 다시 조회
            try {
              const statusResp = await axios.get(`${KAKAO_CONFIG.API_BASE_URL}/api/user/status`, {
                withCredentials: true
              });
              if (statusResp.status === 200) {
                const json = statusResp.data;
                let statusData: { basic?: boolean; personal?: boolean; cognitiveAudio?: boolean; cognitiveImage?: boolean } = {};
                
                if (typeof json === 'object' && json !== null) {
                  const root = json as Record<string, unknown>;
                  const direct = root['data'];
                  if (typeof direct === 'object' && direct !== null) {
                    statusData = direct as { basic?: boolean; personal?: boolean; cognitiveAudio?: boolean; cognitiveImage?: boolean };
                  }
                }
                
                // 회상훈련 세션 상태를 localStorage에 저장
                const completed: string[] = [];
                if (statusData.basic) completed.push('memory');
                if (statusData.personal) completed.push('story');
                if (statusData.cognitiveAudio) completed.push('music');
                if (statusData.cognitiveImage) completed.push('photo');
                
                localStorage.setItem('completedRecallTrainingSessions', JSON.stringify(completed));
                console.log('이미 역할 설정된 카카오 사용자 - 회상훈련 상태 저장 완료:', completed);
              }
            } catch (e) {
              console.error('이미 역할 설정된 카카오 사용자 - 회상훈련 상태 조회 실패:', e);
            }
            
            // role 값을 업데이트하여 콜백 페이지에서 올바른 페이지로 이동하도록 함
            const result = {
              success: true,
              status: 'success' as const,
              user: {
                id: userData.id,
                email: userData.email,
                name: userData.name,
                role: savedRole as 'ELDER' | 'GUARDIAN' | 'USER' // 저장된 역할 사용
              }
            };
            console.log('✅ 최종 반환 결과 (저장된 역할 사용):', result);
            return result;
          }
        }
      } else if (role === 'ELDER' || role === 'GUARDIAN') {
        // 이미 역할이 설정된 사용자의 경우 회상훈련 상태도 다시 조회
        try {
          const statusResp = await axios.get(`${KAKAO_CONFIG.API_BASE_URL}/api/user/status`, {
            withCredentials: true
          });
          if (statusResp.status === 200) {
            const json = statusResp.data;
            let statusData: { basic?: boolean; personal?: boolean; cognitiveAudio?: boolean; cognitiveImage?: boolean } = {};
            
            if (typeof json === 'object' && json !== null) {
              const root = json as Record<string, unknown>;
              const direct = root['data'];
              if (typeof direct === 'object' && direct !== null) {
                statusData = direct as { basic?: boolean; personal?: boolean; cognitiveAudio?: boolean; cognitiveImage?: boolean };
              }
            }
            
            // 회상훈련 세션 상태를 localStorage에 저장
            const completed: string[] = [];
            if (statusData.basic) completed.push('memory');
            if (statusData.personal) completed.push('story');
            if (statusData.cognitiveAudio) completed.push('music');
            if (statusData.cognitiveImage) completed.push('photo');
            
            localStorage.setItem('completedRecallTrainingSessions', JSON.stringify(completed));
            console.log('이미 역할 설정된 카카오 사용자 - 회상훈련 상태 저장 완료:', completed);
          }
        } catch (e) {
          console.error('이미 역할 설정된 카카오 사용자 - 회상훈련 상태 조회 실패:', e);
        }
      }

      const result = {
        success: true,
        status: 'success' as const,
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: role as 'ELDER' | 'GUARDIAN' | 'USER'
        }
      };

      console.log('✅ 최종 반환 결과:', result);
      return result;
    } else {
      return {
        success: false,
        status: 'error',
        error: '사용자 정보를 가져올 수 없습니다.'
      };
    }
  } catch (error: unknown) {
    console.error('카카오 콜백 처리 오류:', error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const statusText = error.response?.statusText;

      console.error('📡 백엔드 API 에러 상세:', {
        status,
        statusText,
        url: error.config?.url,
        data: error.response?.data,
        headers: error.response?.headers
      });

      let errorMessage = '카카오 로그인 처리 중 오류가 발생했습니다.';

      if (status === 500) {
        errorMessage = '백엔드 서버에서 카카오 로그인 처리 중 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        console.error('🚨 백엔드 500 에러 - OAuth2 처리 실패');
      } else if (status === 401) {
        errorMessage = '카카오 로그인 인증이 실패했습니다. 다시 로그인해주세요.';
      } else if (status === 403) {
        errorMessage = '카카오 로그인 접근 권한이 없습니다.';
      } else if (status === 404) {
        errorMessage = '카카오 로그인 API를 찾을 수 없습니다. 관리자에게 문의하세요.';
      } else if ((error as { code?: string }).code === 'ECONNREFUSED' || (error as { code?: string }).code === 'NETWORK_ERROR') {
        errorMessage = '백엔드 서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.';
      } else {
        errorMessage = error.response?.data?.message || error.message || errorMessage;
      }

      return {
        success: false,
        status: 'error',
        error: errorMessage
      };
    }

    return {
      success: false,
      status: 'error',
      error: error instanceof Error ? error.message : '서버와의 통신 중 오류가 발생했습니다.'
    };
  }
};

/**
 * 카카오 로그아웃
 */
export const kakaoLogout = async (): Promise<void> => {
  try {
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      await axios.post(
        `${KAKAO_CONFIG.API_BASE_URL}/api/auth/kakao/logout`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
    }
  } catch (error) {
    console.error('카카오 로그아웃 오류:', error);
  } finally {
    // 로컬 스토리지 정리
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('kakaoSurveyCompleted'); // 설문조사 완료 플래그 삭제
    localStorage.removeItem('phone');
    localStorage.removeItem('birthDate');
    localStorage.removeItem('kakaoUserInfo');
    localStorage.removeItem('isdailysurveycompleted');
    localStorage.removeItem('completedRecallTrainingSessions');
  }
};