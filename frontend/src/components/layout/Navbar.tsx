'use client';

//
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from './Navbar.module.css';
import LoginModal from '../auth/LoginModal';
import SignupModal from '../auth/SignupModal';
import { Divide } from 'lucide-react';

const Navbar = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userType, setUserType] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // 로그인 상태를 확인하는 함수
  const checkAuthStatus = () => {
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name');
    const isLoggedInFlag = localStorage.getItem('isLoggedIn');
    
    // role이 있고, 이름과 로그인 플래그가 있으면 로그인된 상태
    if (role && name && isLoggedInFlag === 'true') {
      setIsLoggedIn(true);
      setUserName(name);
      // role을 userType으로 변환 (기존 호환성 유지)
      setUserType(role === 'ELDER' ? '0' : '1');
    } else {
      setIsLoggedIn(false);
      setUserName('');
      setUserType(null);
    }
  };

  useEffect(() => {
    // 컴포넌트가 마운트될 때와 pathname이 변경될 때 로그인 상태 확인
    checkAuthStatus();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('http://recode-my-life.site/api/user/logout', {
      // await fetch(`${NEXT_PUBLIC_API_URL || 'http://localhost:8088'}/api/user/logout`, {
        method: 'POST',
        credentials: 'include', // 세션 쿠키를 포함하여 요청
      });
    } catch (error) {
      // 서버 로그아웃 요청에 실패하더라도 클라이언트에서는 로그아웃 처리를 계속 진행합니다.
      console.error('Logout API call failed:', error);
    } finally {
      // API 요청 성공 여부와 관계없이 클라이언트 측 상태를 업데이트합니다.
      localStorage.removeItem('role');
      localStorage.removeItem('name');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('dailySurveyData');
      localStorage.removeItem('isdailysurveycompleted');
      localStorage.removeItem('userID');
      localStorage.removeItem('userId');
      localStorage.removeItem('userType');
      localStorage.removeItem('completedRecallTrainingSessions');
      // localStorage 정리 후 상태 재확인
      checkAuthStatus();
      router.replace('/'); // 로그아웃 후 메인으로 이동
    }
  };

  const handleLoginSuccess = () => {
    // localStorage 업데이트 후 상태 재확인
    setTimeout(() => {
      checkAuthStatus();
    }, 100); // localStorage 업데이트를 위한 약간의 지연
    setIsLoginModalOpen(false);
  };

  // 기록하기 클릭 시 일일 설문 완료 여부에 따라 경로 분기
  const handleRecordClick = (e?: React.MouseEvent) => {
    try {
      const completed = typeof window !== 'undefined' ? localStorage.getItem('isdailysurveycompleted') : null;
      if (completed === '1') {
        router.push('/main-elder/recall-training');
      } else {
        router.push('/main-elder/daily-survey');
      }
    } catch {
      router.push('/main-elder/daily-survey');
    }
  };

  // 로고 링크 동적 처리
  let logoHref = "/";
  if (isLoggedIn) {
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
            <span className={styles.logoText}>RE:CODE</span>
          </Link>
        </div>
        
        <div className={styles.authLinks}>
          {isLoggedIn ? (
            <>
              {/* 노인 계정일 때만 기록하기 표시 */}
              {userType === '0' && (
                <button onClick={handleRecordClick} className={styles.authLink}>
                  기록하기
                </button>
              )}
              {/* 보호자 계정일 때는 빈 공간으로 기록하기 버튼과 같은 크기 유지 */}
              {userType === '1' && <div></div>}
              
              <Link href="/userinfo" className={styles.authLink}>회원정보</Link>
              <Link href="/calender" className={styles.authLink}>회상캘린더</Link>
              <button onClick={handleLogout} className={styles.authLink}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <div></div>
              <div></div>
              <div></div>
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
        
        {/* 사용자명을 별도로 분리하여 오른쪽 끝에 배치 */}
        {isLoggedIn && (
          <div className={styles.userNameContainer}>
            <Link href="/userinfo" className={styles.userNameLink}>
              {userName}님
            </Link>
          </div>
        )}
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
