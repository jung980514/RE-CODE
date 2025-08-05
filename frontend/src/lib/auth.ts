import { authApi, TokenResponse, User } from './api';

// 로그인 상태 및 사용자 타입 확인 유틸리티
export const isLoggedIn = (): boolean => {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('accessToken');
  return !!token;
};

export const getUserType = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userType');
};

export const isElderUser = (): boolean => {
  const userType = getUserType();
  return userType === 'ELDER';
};

export const isGuardianUser = (): boolean => {
  const userType = getUserType();
  return userType === 'GUARDIAN';
};

export const getUserEmail = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userEmail');
};

export const getUserName = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userName');
};

// 토큰 저장 함수
export const saveTokens = (tokens: TokenResponse): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
};

// 사용자 정보 저장 함수
export const saveUserInfo = (user: User): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('userType', user.role);
  localStorage.setItem('userEmail', user.email);
  localStorage.setItem('userName', user.name);
};

// 로그아웃 함수
export const logout = async (): Promise<void> => {
  try {
    // 백엔드에 로그아웃 요청
    await authApi.logout();
  } catch (error) {
    console.error('로그아웃 요청 실패:', error);
  } finally {
    // 로컬 스토리지 정리
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userType');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
    }
  }
};

// 로그인 함수
export const login = async (email: string, password: string): Promise<User> => {
  try {
    const response = await authApi.login({ email, password });
    
    if (response.status === 'success') {
      // 토큰 저장
      saveTokens(response.data);
      
      // 사용자 정보 조회
      const userResponse = await authApi.getUser();
      
      if (userResponse.status === 'success') {
        // 사용자 정보 저장
        saveUserInfo(userResponse.data);
        return userResponse.data;
      } else {
        throw new Error('사용자 정보 조회에 실패했습니다.');
      }
    } else {
      throw new Error(response.message || '로그인에 실패했습니다.');
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
        throw new Error(error.message);
    } else {
      throw new Error('로그인에 실패했습니다.');
    }
  }
};

// 회원가입 함수
export const register = async (userData: {
  name: string;
  email: string;
  password: string;
  phone: string;
  birthDate: string;
  role: 'ELDER' | 'GUARDIAN';
}): Promise<string> => {
  try {
    const response = await authApi.register(userData);
    
    if (response.status === 'success') {
      return response.data;
    } else {
      throw new Error(response.message || '회원가입에 실패했습니다.');
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
        throw new Error(error.message);
    } else {
      throw new Error('회원가입에 실패했습니다.');
    }
  }
}; 