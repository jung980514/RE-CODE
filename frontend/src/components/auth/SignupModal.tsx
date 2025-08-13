'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './SignupModal.module.css';
import GuardianSignupModal from './GuardianSignupModal';
import OldPeopleSignupModal from './OldPeopleSignupModal';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin?: () => void;
}

const SignupModal: React.FC<SignupModalProps> = ({ isOpen, onClose, onOpenLogin }) => {
  // 모달의 표시 상태와 애니메이션 상태를 분리
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // GuardianSignupModal 상태 관리
  const [showGuardianSignup, setShowGuardianSignup] = useState(false);
  // OldPeopleSignupModal 상태 관리
  const [showOldPeopleSignup, setShowOldPeopleSignup] = useState(false);

  // isOpen 상태 변화에 따른 애니메이션 처리 및 스크롤 제어
  useEffect(() => {
    if (isOpen) {
      // 현재 스크롤 위치 저장
      const scrollY = window.scrollY;
      
      // 모달이 열릴 때 배경 스크롤 막기
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10);

      return () => clearTimeout(timer);
    } else {
      // 모달이 닫힐 때 배경 스크롤 복원
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
      
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // 컴포넌트 언마운트 시 스크롤 복원
  useEffect(() => {
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, []);

  const handleSeniorSignup = () => {
    setShowOldPeopleSignup(true);
  };

  const handleGuardianSignup = () => {
    setShowGuardianSignup(true);
  };

  const handleBackToSignup = () => {
    setShowGuardianSignup(false);
    setShowOldPeopleSignup(false);
  };

  const handleSignupSuccess = () => {
    // 모든 모달 닫기
    setShowGuardianSignup(false);
    setShowOldPeopleSignup(false);
    onClose();
    
    // 로그인 모달 열기
    if (onOpenLogin) {
      onOpenLogin();
    }
  };

  // 모달이 완전히 숨겨진 상태에서는 렌더링하지 않음
  if (!isVisible) return null;

  return (
    <>
      <div 
        className={`${styles.overlay} ${isAnimating ? styles.overlayOpen : styles.overlayClose}`}
        onClick={onClose}
      >
        <div 
          className={`${styles.modal} ${isAnimating ? styles.modalOpen : styles.modalClose}`}
          onClick={e => e.stopPropagation()}
        >
          <div className={styles.header}>
            <div className={styles.titleWrapper}>
              <h2 className={styles.title}>환영합니다!</h2>
              <p className={styles.subtitle}>
                몇가지 정보만 입력하시면 바로 시작하실 수 있어요!
              </p>
            </div>
          </div>

          <div className={styles.logoContainer}>
            <Image
              src="/icons/logo.png"
              alt="RE:CORD Logo"
              width={554}
              height={71}
              className={styles.logo}
            />
            <span className={styles.logoText}>RE:CODE</span>
          </div>

          <div className={styles.content}>
            <h3 className={styles.signupQuestion}>누구로 가입하시나요?</h3>
            
            <button 
              type="button"
              className={`${styles.signupButton} ${styles.guardianButton}`}
              onClick={handleGuardianSignup}
            >
              보호자로 가입하기
            </button>
            <div className={styles.divider}>
            <span>또는</span>
          </div>
            <button 
              type="button"
              className={`${styles.signupButton} ${styles.seniorButton}`}
              onClick={handleSeniorSignup}
            >
              노인으로 가입하기
            </button>

            <button 
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
            >
              취소
            </button>
          </div>
        </div>
      </div>

      {/* GuardianSignupModal */}
      <GuardianSignupModal
        isOpen={showGuardianSignup}
        onClose={() => setShowGuardianSignup(false)}
        onBackToSignup={handleBackToSignup}
        onSignupSuccess={handleSignupSuccess}
      />
      {/* OldPeopleSignupModal */}
      <OldPeopleSignupModal
        isOpen={showOldPeopleSignup}
        onClose={() => setShowOldPeopleSignup(false)}
        onBackToSignup={handleBackToSignup}
        onSignupSuccess={handleSignupSuccess}
      />
    </>
  );
};

export default SignupModal;
