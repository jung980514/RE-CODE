'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { kakaoLogin } from '@/api/kakaoLogin';
import styles from './KakaoLoginButton.module.css';

interface KakaoLoginButtonProps {
  onSuccess?: (userType: number) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  usePopup?: boolean; // true: 팝업, false: 리다이렉트
  className?: string;
}

const KakaoLoginButton: React.FC<KakaoLoginButtonProps> = ({
  onError,
  disabled = false,
  className
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleKakaoLogin = async () => {
    if (disabled || isLoading) return;

    console.log('🎯 카카오 로그인 버튼 클릭됨');
    setIsLoading(true);
    
    try {
      // 백엔드 OAuth2 엔드포인트로 리다이렉트
      console.log('📡 kakaoLogin 함수 호출');
      const result = await kakaoLogin(false); // 리다이렉트 방식 사용
      
      console.log('✅ kakaoLogin 결과:', result);
      
      if (result.success) {
        // 리다이렉트가 시작되므로 여기서는 성공 처리를 하지 않음
        // 실제 성공 처리는 콜백 페이지에서 수행됨
      } else {
        // 에러 콜백 호출
        const errorMessage = result.error || result.message || '카카오 로그인에 실패했습니다.';
        console.error('❌ 카카오 로그인 실패:', errorMessage);
        onError?.(errorMessage);
      }
    } catch (error) {
      console.error('❌ 카카오 로그인 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '카카오 로그인 중 오류가 발생했습니다.';
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={`${styles.kakaoButton} ${className || ''}`}
      onClick={handleKakaoLogin}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <>
          <span className={styles.loadingSpinner}></span>
          카카오 로그인 중...
        </>
      ) : (
        <>
          <Image
            src="/icons/kakao.png"
            alt="Kakao"
            width={24}
            height={24}
            className={styles.kakaoIcon}
          />
          카카오 로그인
        </>
      )}
    </button>
  );
};

export default KakaoLoginButton;
