'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from './Navbar.module.css';
import LoginModal from '../auth/LoginModal';
import SignupModal from '../auth/SignupModal';

const Navbar = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 컴포넌트가 마운트될 때 localStorage를 확인하여 로그인 상태를 설정합니다.
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    // 필요하다면 다른 사용자 정보도 함께 삭제합니다.
    // localStorage.removeItem('user');
    setIsLoggedIn(false);
    router.replace('/'); // 로그아웃 후 메인으로 이동
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setIsLoginModalOpen(false);
  };

  // 로고 링크 동적 처리
  let logoHref = "/";
  if (isLoggedIn) {
    const userType = typeof window !== 'undefined' ? localStorage.getItem('userType') : null;
    if (userType === "0") logoHref = "/main-elder";
    else if (userType === "1") logoHref = "/main-guardian";
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
                <Link href="/userinfo" className={styles.authLink}>회원정보</Link>
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
