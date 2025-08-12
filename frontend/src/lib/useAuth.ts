"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from './auth';

export const useAuth = (requiredRole?: 'ELDER' | 'GUARDIAN') => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [authState, setAuthState] = useState({
    isLoggedIn: false,
    role: null as 'ELDER' | 'GUARDIAN' | 'ADMIN' | null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkAuth = () => {
      const loggedIn = isLoggedIn();
      const role = localStorage.getItem('role') as 'ELDER' | 'GUARDIAN' | 'ADMIN' | null;

      console.log('🔍 useAuth 체크:', { loggedIn, role, requiredRole });

      setAuthState({
        isLoggedIn: loggedIn,
        role,
      });

      if (!loggedIn) {
        console.log('❌ 로그인되지 않음 → 홈으로 이동');
        router.push('/');
        return;
      }

      if (requiredRole && role !== requiredRole) {
        console.log('❌ 역할 불일치 → 홈으로 이동', { expected: requiredRole, actual: role });
        // 잘못된 역할로 접근 시 메인으로 이동
        router.push('/');
        return;
      }

      console.log('✅ 인증 성공');
      setIsLoading(false);
    };

    checkAuth();
  }, [router, requiredRole]);

  return {
    ...authState,
    isLoading,
  };
};