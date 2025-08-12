'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { handleKakaoCallback } from '@/api/kakaoLogin';

const KakaoCallbackPage: React.FC = () => {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('카카오 로그인을 처리하고 있습니다...');

  useEffect(() => {
    let mounted = true; // 컴포넌트 마운트 상태 추적
    
    const processCallback = async () => {
      if (!mounted) return; // 언마운트된 경우 처리 중단
      
      try {
        // URL 파라미터 확인 - 에러가 있는지 체크
        const urlParams = new URLSearchParams(window.location.search);
        const errorParam = urlParams.get('error');
        
        console.log('🔍 URL 파라미터 확인:', {
          error: errorParam,
          fullURL: window.location.href,
          search: window.location.search
        });
        
        // 에러 파라미터가 있으면 에러 처리
        if (errorParam) {
          console.log('❌ OAuth2 에러 감지:', errorParam);
          if (mounted) {
            setStatus('error');
            setMessage('카카오 로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
            
            setTimeout(() => {
              if (mounted) router.push('/');
            }, 3000);
          }
          return;
        }

        // 백엔드에서 카카오 로그인 처리 완료 후 사용자 정보 확인
        const result = await handleKakaoCallback();

        console.log('🔥 콜백 결과:', result);

        if (!mounted) return; // API 호출 후 언마운트 체크

        if (result.success && result.user) {
          console.log('🎯 사용자 정보:', result.user);
          console.log('🎯 사용자 역할:', result.user.role);
          
          // 즉시 페이지 이동 (딜레이 없음)
          console.log('🚀 페이지 이동 시작, role:', result.user?.role);
          
          if (result.user?.role === 'ELDER') {
            console.log('👴 노인 사용자 → /main-elder로 이동');
            router.replace('/main-elder');
          } else if (result.user?.role === 'GUARDIAN') {
            console.log('👨‍👩‍👧‍👦 보호자 사용자 → /main-guardian로 이동');
            router.replace('/main-guardian');
          } else if (result.user?.role === 'USER' || !result.user?.role) {
            console.log('📋 최초 로그인 사용자 → /auth/kakao/setup로 이동');
            // 최초 로그인 - 설문조사 페이지로 이동
            router.replace('/auth/kakao/setup');
          } else {
            console.log('❓ 알 수 없는 사용자 역할 → /로 이동');
            router.replace('/');
          }
        } else {
          const errorMsg = result.error || '로그인에 실패했습니다.';
          console.error('🚨 카카오 로그인 실패:', errorMsg);
          setStatus('error');
          setMessage(errorMsg);
          
          // 500 에러인 경우 더 긴 대기 시간
          const waitTime = errorMsg.includes('내부 오류') || errorMsg.includes('500') ? 5000 : 3000;
          
          setTimeout(() => {
            if (mounted) router.push('/');
          }, waitTime);
        }
      } catch (error) {
        console.error('🚨 카카오 콜백 처리 오류:', error);
        
        if (mounted) {
          setStatus('error');
          setMessage('카카오 로그인 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
          
          setTimeout(() => {
            if (mounted) router.push('/');
          }, 4000);
        }
      }
    };

    processCallback();
    
    // 클린업 함수로 마운트 상태 변경
    return () => {
      mounted = false;
    };
  }, [router]); // router를 dependency에 포함

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Pretendard, sans-serif'
    }}>
      {status === 'error' && (
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#EF4444',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: 'white',
            fontSize: '20px'
          }}>✕</div>
          <h2 style={{ color: '#EF4444', marginBottom: '10px' }}>로그인 실패</h2>
          <p style={{ color: '#666', lineHeight: '1.5' }}>
            {message}
          </p>
          <p style={{ color: '#999', fontSize: '14px', marginTop: '20px' }}>
            잠시 후 자동으로 이동됩니다...
          </p>
        </div>
      )}
    </div>
  );
};

export default KakaoCallbackPage;
