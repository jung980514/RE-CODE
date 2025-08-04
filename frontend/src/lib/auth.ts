// 로그인 상태 및 사용자 타입 확인 유틸리티

export const isLoggedIn = (): boolean => {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('token');
  return !!token;
};

export const getUserType = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userType');
};

export const isElderUser = (): boolean => {
  const userType = getUserType();
  return userType === '0';
};

export const isGuardianUser = (): boolean => {
  const userType = getUserType();
  return userType === '1';
};

export const getUserEmail = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userEmail');
};

export const logout = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('userType');
  localStorage.removeItem('userEmail');
}; 