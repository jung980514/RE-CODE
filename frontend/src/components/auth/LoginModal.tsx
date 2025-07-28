'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { VirtualKeyboard } from '@/components/common/VirtualKeyboard';
import SignupModal from './SignupModal';
import styles from './LoginModal.module.css';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });

  // 모달의 표시 상태와 애니메이션 상태를 분리
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 가상 키보드 관련 상태
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [activeInput, setActiveInput] = useState<'username' | 'password' | null>(
    null,
  );
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // 회원가입 모달 상태
  const [showSignupModal, setShowSignupModal] = useState(false);

  // 마우스 다운 시작 위치를 추적하기 위한 ref
  const mouseDownTargetRef = useRef<EventTarget | null>(null);

  // isOpen 상태 변화에 따른 애니메이션 처리
  useEffect(() => {
    if (isOpen) {
      // 모달 열기
      setIsVisible(true);
      // 약간의 지연 후 애니메이션 시작
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10); // 10ms 지연으로 CSS transition이 감지되도록 함

      return () => clearTimeout(timer);
    } else {
      // 모달 닫기 애니메이션 시작
      setIsAnimating(false);

      // 애니메이션 완료 후 모달 숨기기
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsKeyboardVisible(false); // 모달이 닫힐 때 키보드도 닫기
      }, 300); // CSS transition 지속 시간과 맞춰야 함

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement login logic
    console.log('Login attempt:', formData);
  };

  const handleKakaoLogin = () => {
    // TODO: Implement Kakao login
    console.log('Kakao login clicked');
  };

  const handleSignupClick = () => {
    setShowSignupModal(true);
  };

  const handleToggleKeyboard = () => {
    setIsKeyboardVisible((prev) => !prev);
  };

  const focusActiveInput = () => {
    // 가상 키보드 버튼 클릭으로 인해 입력 필드가 포커스를 잃는 것을 방지하고,
    // 커서를 항상 텍스트 맨 뒤로 이동시킵니다.
    setTimeout(() => {
      const inputRef =
        activeInput === 'username' ? usernameInputRef : passwordInputRef;

      if (inputRef.current) {
        const inputElement = inputRef.current;
        inputElement.focus();
        const valueLength = inputElement.value.length;
        // setSelectionRange를 사용하여 커서 위치를 맨 뒤로 설정합니다.
        inputElement.setSelectionRange(valueLength, valueLength);
      }
    }, 0);
  };

  // 가상 키보드 입력 처리
  const handleVirtualKeyPress = (key: string, replaceLast = false) => {
    if (!activeInput) return;

    setFormData((prev) => {
      const currentVal = prev[activeInput];
      const newVal = replaceLast
        ? currentVal.slice(0, -1) + key
        : currentVal + key;
      return { ...prev, [activeInput]: newVal };
    });
    focusActiveInput();
  };

  const handleVirtualBackspace = () => {
    if (!activeInput) return;
    setFormData((prev) => ({
      ...prev,
      [activeInput]: prev[activeInput].slice(0, -1),
    }));
    focusActiveInput();
  };

  const handleVirtualSpace = () => {
    if (!activeInput) return;
    setFormData((prev) => ({
      ...prev,
      [activeInput]: `${prev[activeInput]} `,
    }));
    focusActiveInput();
  };

  const handleVirtualEnter = () => {
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    handleSubmit(fakeEvent);
  };

  // 마우스 다운 이벤트 핸들러
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    mouseDownTargetRef.current = e.target;
  };

  // 마우스 업 이벤트 핸들러
  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    // 마우스 다운과 업이 모두 오버레이에서 발생한 경우에만 모달을 닫습니다.
    if (e.target === e.currentTarget && mouseDownTargetRef.current === e.currentTarget) {
      onClose();
    }
    // 다음 클릭을 위해 초기화
    mouseDownTargetRef.current = null;
  };

  // 모달이 완전히 숨겨진 상태에서는 렌더링하지 않음
  if (!isVisible) return null;

  return (
    <div 
      className={`${styles.overlay} ${isAnimating ? styles.overlayOpen : styles.overlayClose}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div className={`${styles.modal} ${isAnimating ? styles.modalOpen : styles.modalClose}`}>
        <div className={styles.header}>
          <div className={styles.titleWrapper}>
            <h2 className={styles.title}>로그인</h2>
          </div>
          <button type="button" className={styles.closeButton} onClick={handleToggleKeyboard}>
            <Image
              src="/icons/keyboard_icon.png"
              alt="가상 키보드 열기/닫기"
              width={52}
              height={52}
            />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="username">아이디</label>
            <input
              ref={usernameInputRef}
              type="text"
              id="username"
              placeholder="아이디를 입력하세요"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              onFocus={() => setActiveInput('username')}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password">비밀번호</label>
            <div className={styles.passwordInputWrapper}>
              <input
                ref={passwordInputRef}
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="비밀번호를 입력하세요"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                onFocus={() => setActiveInput('password')}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword ? (
                  <EyeOff className={styles.passwordToggleIcon} />
                ) : (
                  <Eye className={styles.passwordToggleIcon} />
                )}
              </button>
            </div>
          </div>
          <div className={styles.optionsRow}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                className={styles.checkbox}
              />
              로그인 상태 유지
            </label>
            <button type="button" className={styles.findAccountButton}>
              아이디/비밀번호 찾기
            </button>
          </div>
          <button 
            type="button" 
            className={styles.kakaoButton}
            onClick={handleKakaoLogin}
          >
            <Image
              src="/icons/kakao_login_large_wide.png"
              alt="Kakao"
              width={258}
              height={29}
              className={styles.kakaoImage}
            />
          </button>
          <button type="submit" className={styles.loginButton}>
            <span className={styles.buttonIcon}>→</span>
            로그인
          </button>
          <div className={styles.divider}>
            <span>또는</span>
          </div>
          <button type="button" className={styles.signupButton} onClick={handleSignupClick}>
            <UserPlus className={styles.buttonIcon} />
            회원가입
          </button>
        </form>
        <VirtualKeyboard
          isVisible={isKeyboardVisible}
          onToggle={handleToggleKeyboard}
          onKeyPress={handleVirtualKeyPress}
          onBackspace={handleVirtualBackspace}
          onSpace={handleVirtualSpace}
          onEnter={handleVirtualEnter}
          currentInputValue={activeInput ? formData[activeInput] : ''}
        />
      </div>

      {/* 회원가입 모달 */}
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
      />
    </div>
  );
};

export default LoginModal;
