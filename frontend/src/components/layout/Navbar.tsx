'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from './Navbar.module.css';
import LoginModal from '../auth/LoginModal';
import SignupModal from '../auth/SignupModal';
import { isLoggedIn, isElderUser, isGuardianUser, logout } from '@/lib/auth';

const Navbar = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 컴포넌트가 마운트될 때 로그인 상태를 확인합니다.
    const checkLoginStatus = () => {
      const loggedIn = isLoggedIn();
      setIsLoggedIn(loggedIn);
    };
    
    checkLoginStatus();
    
    // 로그인 상태 변경을 감지하기 위한 이벤트 리스너
    const handleStorageChange = () => {
      checkLoginStatus();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setIsLoggedIn(false);
      router.replace('/'); // 로그아웃 후 메인으로 이동
    } catch (error) {
      console.error('로그아웃 실패:', error);
      // 로그아웃 요청이 실패해도 로컬 상태는 정리
      setIsLoggedIn(false);
      router.replace('/');
    }
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setIsLoginModalOpen(false);
  };

  // 로고 링크 동적 처리
  let logoHref = "/";
  if (isLoggedIn) {
    if (isElderUser()) logoHref = "/main-elder";
    else if (isGuardianUser()) logoHref = "/main-guardian";
  }
  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.container}>
          <div className={styles.logoContainer}>
            <Link href={logoHref} className={styles.logoLink}>
              <Image
                src="/icons/logo.png"
                alt="RE:CORD Logo"
                width={410}
                height={78}
                priority
                className={styles.logo}
              />
              <span className={styles.logoText}>RE:CORD</span>
            </Link>
          </div>
          <div className={styles.authLinks}>
            {isLoggedIn ? (
              <>
                <Link href="/record" className={styles.authLink}>기록하기</Link>
                <Link href="/mypage" className={styles.authLink}>회원정보</Link>
                <Link href="/calender" className={styles.authLink}>회상캘린더</Link>
                <button onClick={handleLogout} className={styles.authLink}>
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <button 
                  className={styles.authLink} 
                  onClick={() => setIsLoginModalOpen(true)}
                >
                  로그인
                </button>
                <button
                  className={styles.authLink}
                  onClick={() => setIsSignupModalOpen(true)}
                >
                  회원가입
                </button>
              </>
            )}
          </div>
        </div>
        <div className={styles.bottomBar} />
      </nav>
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
      />
    </>
  );
};

export default Navbar;
