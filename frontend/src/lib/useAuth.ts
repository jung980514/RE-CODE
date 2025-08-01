"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn, isElderUser, isGuardianUser } from './auth';

export const useAuth = (requiredUserType?: 'elder' | 'guardian') => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [authState, setAuthState] = useState({
    isLoggedIn: false,
    isElderUser: false,
    isGuardianUser: false,
  });

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window === 'undefined') return;

    const checkAuth = () => {
      const loggedIn = isLoggedIn();
      const elder = isElderUser();
      const guardian = isGuardianUser();

      setAuthState({
        isLoggedIn: loggedIn,
        isElderUser: elder,
        isGuardianUser: guardian,
      });

      // 로그인 상태 확인
      if (!loggedIn) {
        router.push('/');
        return;
      }

      // 특정 사용자 타입이 요구되는 경우
      if (requiredUserType) {
        if (requiredUserType === 'elder' && !elder) {
          router.push('/main-guardian');
          return;
        }
        
        if (requiredUserType === 'guardian' && !guardian) {
          router.push('/main-elder');
          return;
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [router, requiredUserType]);

  return {
    ...authState,
    isLoading,
  };
}; 