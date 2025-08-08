import axios from 'axios';
import { openKakaoLoginPopup, redirectToKakaoLogin } from './kakaoAuth';
import { KakaoLoginResponse, SurveyData } from './types';
import { KAKAO_CONFIG } from './config';

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
      // 리다이렉트 방식 - 백엔드 OAuth2 엔드포인트로 이동
      console.log('🔄 리다이렉트 방식으로 카카오 로그인 시작');
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

/**
 * 백엔드에서 카카오 로그인 후 콜백 처리
 * 백엔드는 쿠키로 토큰을 설정하고 성공 응답을 반환함
 */
export const handleKakaoCallback = async (): Promise<KakaoLoginResponse> => {
  try {
    console.log('🔍 handleKakaoCallback 시작');
    
    // URL에 에러 파라미터가 있는지 먼저 확인
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
    
    // 백엔드에서 설정한 쿠키에서 사용자 정보 확인
    const response = await axios.get(`${KAKAO_CONFIG.API_BASE_URL}/api/user`, {
      withCredentials: true // 쿠키 포함
    });

    console.log('📡 백엔드 응답:', response.data);
    const apiResponse = response.data;
    
    if (apiResponse.status === 'success' && apiResponse.data) {
      const userData = apiResponse.data;
      console.log('👤 사용자 데이터:', userData);
      
      // 사용자 타입 결정 (백엔드 Role enum 기반)
      let userType = 2; // 기본값: 설문조사 필요
      if (userData.role === 'ELDER') {
        userType = 0;
      } else if (userData.role === 'GUARDIAN') {
        userType = 1;
      } else if (userData.role === 'USER') {
        userType = 2; // 최초 사용자 - 설문조사 필요
      }
      
      console.log('🎯 사용자 역할:', userData.role, '→ 사용자 타입:', userType);
      
      // localStorage에 사용자 정보 저장
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userType', userType.toString());
      localStorage.setItem('name', userData.name || '');
      localStorage.setItem('email', userData.email || '');

      // 최초 로그인 사용자인 경우 설문조사 완료 여부 확인
      if (userType === 2) {
        // 카카오 설문조사 완료 여부 확인 (이메일별)
        const userEmail = userData.email?.replace('kakao ', '') || 'unknown';
        const surveyCompleted = localStorage.getItem(`kakao_survey_completed_${userEmail}`) === 'true';
        
        console.log('🔍 설문조사 완료 여부 확인:', {
          userEmail,
          surveyCompleted
        });
        
        if (surveyCompleted) {
          // 이미 설문조사를 완료한 사용자 - 저장된 userType 사용
          const savedUserType = localStorage.getItem('userType');
          userType = savedUserType ? parseInt(savedUserType) : 2;
          console.log('✅ 설문조사 완료된 사용자, 저장된 userType:', userType);
        } else {
          // 설문조사 미완료 - 카카오 정보를 설문조사에서 사용할 수 있도록 저장
          localStorage.setItem('kakaoUserInfo', JSON.stringify({
            id: userData.id,
            name: userData.name,
            email: userData.email
          }));
          console.log('⚠️ 설문조사 필요한 사용자');
        }
      }

      const result = {
        success: true,
        status: 'success' as const,
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          userType: userType
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
  } catch (error) {
    console.error('카카오 콜백 처리 오류:', error);
    
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.message;
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
 * 설문조사 데이터 제출 (카카오 로그인 후 추가 정보 입력 완료)
 */
export const submitSurvey = async (surveyData: SurveyData): Promise<KakaoLoginResponse> => {
  try {
    console.log('📤 설문조사 데이터 제출:', surveyData);
    
    // 카카오에서 받은 사용자 정보 가져오기
    const kakaoUserInfo = JSON.parse(localStorage.getItem('kakaoUserInfo') || '{}');
    
    console.log('📤 추가 정보 localStorage 저장 (카카오 계정 설정 완료):', {
      phone: surveyData.additionalInfo?.phoneNumber,
      birthDate: surveyData.additionalInfo?.birthDate,
      userType: surveyData.userType
    });
    
    // 설문조사 완료 처리 - localStorage에 영구 저장
    localStorage.setItem('userType', surveyData.userType.toString());
    localStorage.setItem('isLoggedIn', 'true');
    
    // 추가 정보 localStorage에 저장
    if (surveyData.additionalInfo?.phoneNumber) {
      localStorage.setItem('phone', String(surveyData.additionalInfo.phoneNumber));
    }
    if (surveyData.additionalInfo?.birthDate) {
      localStorage.setItem('birthDate', String(surveyData.additionalInfo.birthDate));
    }
    
    // 카카오 설문조사 완료 플래그 (이메일별로 저장)
    const userEmail = kakaoUserInfo.email?.replace('kakao ', '') || 'unknown';
    localStorage.setItem(`kakao_survey_completed_${userEmail}`, 'true');
    
    // 카카오 임시 정보 삭제
    localStorage.removeItem('kakaoUserInfo');
    
    return {
      success: true,
      status: 'success',
      user: {
        id: kakaoUserInfo.id || '',
        userType: surveyData.userType,
        name: kakaoUserInfo.name || '',
        email: userEmail
      },
      message: '설정이 완료되었습니다.'
    };
  } catch (error) {
    console.error('설정 저장 오류:', error);
    
    return {
      success: false,
      status: 'error',
      error: error instanceof Error ? error.message : '설정 저장 중 오류가 발생했습니다.'
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
    localStorage.removeItem('userType');
    localStorage.removeItem('name');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('kakaoSurveyCompleted'); // 설문조사 완료 플래그 삭제
    localStorage.removeItem('phone');
    localStorage.removeItem('birthDate');
    localStorage.removeItem('kakaoUserInfo');
  }
};
