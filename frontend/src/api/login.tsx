interface LoginCredentials {
  email: string;
  password?: string;
}

// API 응답으로 기대되는 사용자 정보 타입 (백엔드 기준)
interface BackendUser {
  email: string;
  role: 'ELDER' | 'GUARDIAN';
  // 백엔드에서 추가로 반환하는 사용자 정보가 있다면 여기에 추가할 수 있습니다.
  // 예: name: string;
}

// 프론트엔드에서 사용하는 사용자 정보 타입 (LoginModal.tsx 기준)
export interface User {
  role: 'ELDER' | 'GUARDIAN';
  email: string;
}

/**
 * 실제 백엔드에 로그인 요청을 보냅니다.
 * 성공 시 로컬 스토리지에 토큰을 저장하고 사용자 정보를 반환합니다.
 * @param credentials - 로그인 정보 (email, password)
 * @returns Promise<User> - 로그인 성공 시 유저 정보 반환
 */
export const login = async (credentials: LoginCredentials): Promise<User> => {
  try {
    const response = await fetch('https://recode-my-life.site/api/user/login', {
    // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088'}/api/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
      // 세션 쿠키를 주고받기 위해 'include' 옵션을 사용합니다. (백엔드 CORS 설정 필요)
      credentials: 'include',
    });

    if (!response.ok) {
      let errorMessage = '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.';
      try {
        // 서버가 구체적인 에러 메시지를 JSON으로 반환하는 경우
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // JSON 파싱 실패 시 기본 에러 메시지 사용
      }
      throw new Error(errorMessage);
    }

    // 로그인 성공 시, 서버가 사용자 정보를 JSON으로 반환합니다.
    const backendUser: BackendUser = await response.json();

    // 백엔드 응답(role)을 프론트엔드에 맞게 변환합니다.
    const user: User = {
      email: backendUser.email,
      role: backendUser.role,
    };

    // 로그인 성공 후 사용자 정보 조회 및 콘솔 출력
    try {
      const userInfoResponse = await fetch('https://recode-my-life.site/api/user/', {
      // const userInfoResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088'}/api/user/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        console.log('로그인 후 사용자 정보:', userInfo);
        localStorage.setItem("name", userInfo.data.name);
        localStorage.setItem("userID", userInfo.data.id);
        localStorage.setItem("role", userInfo.data.role);
        localStorage.setItem("isLoggedIn", "true");
      }
    } catch (e) {
      console.error('로그인 후 사용자 정보 조회 실패:', e);
    }

    // 로그인 성공 후 일일 설문 완료 여부 조회 → 로컬스토리지 플래그 저장
    try {
      const dailySurveyResp = await fetch('https://recode-my-life.site/api/user/daily-survey', {
      // const dailySurveyResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088'}/api/user/daily-survey`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      })
      if (dailySurveyResp.ok) {
        const json: unknown = await dailySurveyResp.json()
        // 다양한 응답 래퍼에 대해 안전하게 파싱
        let isCompleted = false
        if (typeof json === 'boolean') {
          isCompleted = json
        } else if (typeof json === 'string') {
          isCompleted = json === 'true'
        } else if (typeof json === 'object' && json !== null) {
          const root = json as Record<string, unknown>
          const direct = root['isCompleted']
          if (typeof direct === 'boolean') {
            isCompleted = direct
          } else {
            const dataVal = root['data']
            if (typeof dataVal === 'boolean') {
              isCompleted = dataVal
            } else if (typeof dataVal === 'string') {
              isCompleted = dataVal === 'true'
            } else if (typeof dataVal === 'object' && dataVal !== null) {
              const nested = dataVal as Record<string, unknown>
              const nestedFlag = nested['isCompleted']
              if (typeof nestedFlag === 'boolean') {
                isCompleted = nestedFlag
              }
            }
          }
        }
        localStorage.setItem('isdailysurveycompleted', isCompleted ? '1' : '0')
      } else {
        localStorage.setItem('isdailysurveycompleted', '0')
      }
    } catch (e) {
      console.error('일일 설문 완료 여부 조회 실패:', e)
      try { localStorage.setItem('isdailysurveycompleted', '0') } catch {}
    }

    return user;
  } catch (error) {
    console.error('Login API call failed:', error);
    throw error instanceof Error ? error : new Error('네트워크 오류 또는 알 수 없는 문제가 발생했습니다.');
  }
};