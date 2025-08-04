'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import styles from './FindAccountModal.module.css';
import { VirtualKeyboard } from '@/components/common/VirtualKeyboard';

interface FindAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FindAccountModal: React.FC<FindAccountModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'findId' | 'resetPassword'>('findId');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    id: '',
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [activeInput, setActiveInput] = useState<'name' | 'phone' | 'id' | 'newPassword' | 'confirmPassword' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [foundEmail, setFoundEmail] = useState<string | null>(null);
  const [showPasswordReset, setShowPasswordReset] = useState(false); // 비밀번호 재설정 화면 표시 상태
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  const mouseDownTargetRef = useRef<EventTarget | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);
  const newPasswordInputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsKeyboardVisible(false);
        // 모달이 닫힐 때 모든 상태 초기화
        setFoundEmail(null);
        setShowPasswordReset(false);
        setError(null);
        setHasError(false);
        setPasswordError(null);
        setFormData({ name: '', phone: '', id: '' });
        setPasswordData({ newPassword: '', confirmPassword: '' });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setHasError(false);

    try {
      // 로딩 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (activeTab === 'findId') {
        // 아이디 찾기 성공 케이스
        setFoundEmail('test@example.com');
        setFormData({ name: '', phone: '', id: '' });
      } else {
        // 비밀번호 재설정 성공 케이스 (백엔드 구현 전까지 무조건 성공)
        setShowPasswordReset(true);
        setFormData({ name: '', phone: '', id: '' });
      }
      
      // 실패 케이스 (주석처리)
      // throw new Error('API Error');
      
    } catch (err) {
      console.error('Error:', err);
      if (activeTab === 'findId') {
        setError('입력한 정보와 일치하는 이메일을 찾을 수 없습니다. 이름과 전화번호를 확인해주세요.');
      } else {
        setError('입력한 정보와 일치하는 계정을 찾을 수 없습니다. 이메일과 전화번호를 확인해주세요.');
      }
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 비밀번호 유효성 검사
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setPasswordError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    
    setIsLoading(true);
    setPasswordError(null);
    
    try {
      // 로딩 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 비밀번호 변경 성공
      console.log('비밀번호 변경 성공');
      onClose(); // 성공 시 모달 닫기
      
    } catch (err) {
      console.error('Password change error:', err);
      setPasswordError('비밀번호 변경에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: 'findId' | 'resetPassword') => {
    setActiveTab(tab);
    setFormData({
      name: '',
      phone: '',
      id: '',
    });
    setPasswordData({
      newPassword: '',
      confirmPassword: '',
    });
    // 탭 변경 시 모든 상태 초기화
    setError(null);
    setHasError(false);
    setFoundEmail(null);
    setShowPasswordReset(false);
    setPasswordError(null);
  };

  const handleToggleKeyboard = () => {
    setIsKeyboardVisible((prev) => !prev);
  };

  // 입력 필드 변경 시 에러 상태 초기화
  const handleInputChange = (field: 'name' | 'phone' | 'id', value: string) => {
    setFormData({ ...formData, [field]: value });
    if (hasError) {
      setError(null);
      setHasError(false);
    }
    if (foundEmail) {
      setFoundEmail(null);
    }
    if (showPasswordReset) {
      setShowPasswordReset(false);
    }
  };

  const handlePasswordInputChange = (field: 'newPassword' | 'confirmPassword', value: string) => {
    setPasswordData({ ...passwordData, [field]: value });
    if (passwordError) {
      setPasswordError(null);
    }
  };

  const focusActiveInput = () => {
    setTimeout(() => {
      let inputRef: React.RefObject<HTMLInputElement> | null = null;
      if (activeInput === 'name') {
        inputRef = nameInputRef;
      } else if (activeInput === 'phone') {
        inputRef = phoneInputRef;
      } else if (activeInput === 'id') {
        inputRef = idInputRef;
      } else if (activeInput === 'newPassword') {
        inputRef = newPasswordInputRef;
      } else if (activeInput === 'confirmPassword') {
        inputRef = confirmPasswordInputRef;
      }

      if (inputRef?.current) {
        const inputElement = inputRef.current;
        inputElement.focus();
        const valueLength = inputElement.value.length;
        inputElement.setSelectionRange(valueLength, valueLength);
      }
    }, 0);
  };

  const handleVirtualKeyPress = (key: string, replaceLast = false) => {
    if (!activeInput) return;

    if (activeInput === 'newPassword' || activeInput === 'confirmPassword') {
      setPasswordData((prev) => {
        const currentVal = prev[activeInput];
        const newVal = replaceLast
          ? currentVal.slice(0, -1) + key
          : currentVal + key;
        return { ...prev, [activeInput]: newVal };
      });
      
      if (passwordError) {
        setPasswordError(null);
      }
    } else {
      setFormData((prev) => {
        const currentVal = prev[activeInput as keyof typeof prev];
        const newVal = replaceLast
          ? currentVal.slice(0, -1) + key
          : currentVal + key;
        return { ...prev, [activeInput]: newVal };
      });
      
      if (hasError) {
        setError(null);
        setHasError(false);
      }
      if (foundEmail) {
        setFoundEmail(null);
      }
      if (showPasswordReset) {
        setShowPasswordReset(false);
      }
    }
    
    focusActiveInput();
  };

  const handleVirtualBackspace = () => {
    if (!activeInput) return;
    
    if (activeInput === 'newPassword' || activeInput === 'confirmPassword') {
      setPasswordData((prev) => ({
        ...prev,
        [activeInput]: prev[activeInput].slice(0, -1),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [activeInput]: prev[activeInput as keyof typeof prev].slice(0, -1),
      }));
    }
    
    focusActiveInput();
  };

  const handleVirtualSpace = () => {
    if (!activeInput) return;
    
    if (activeInput === 'newPassword' || activeInput === 'confirmPassword') {
      setPasswordData((prev) => ({ 
        ...prev, 
        [activeInput]: `${prev[activeInput]} ` 
      }));
    } else {
      setFormData((prev) => ({ 
        ...prev, 
        [activeInput]: `${prev[activeInput as keyof typeof prev]} ` 
      }));
    }
    
    focusActiveInput();
  };

  const handleVirtualEnter = () => {
    if (showPasswordReset) {
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
      handlePasswordSubmit(fakeEvent);
    } else {
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
      handleSubmit(fakeEvent);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    mouseDownTargetRef.current = e.target;
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && mouseDownTargetRef.current === e.currentTarget) {
      onClose();
    }
    mouseDownTargetRef.current = null;
  };

  // 로딩 스피너 컴포넌트
  const LoadingSpinner = () => (
    <div className={styles.spinner}>
      <div className={styles.spinnerCircle}></div>
    </div>
  );

  if (!isVisible) return null;

  return (
    <div
      className={`${styles.overlay} ${isAnimating ? styles.overlayOpen : styles.overlayClose}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div className={`${styles.modal} ${isAnimating ? styles.modalOpen : styles.modalClose}`}>
        <div className={styles.header}>
          <button type="button" className={styles.keyboardButton} onClick={handleToggleKeyboard}>
            <Image
              src="/icons/keyboard_icon.png"
              alt="가상 키보드 열기/닫기"
              width={52}
              height={52}
            />
          </button>
          <h2 className={styles.title}>
            {showPasswordReset ? '새 비밀번호 설정' : activeTab === 'findId' ? '이메일 찾기' : '비밀번호 찾기'}
          </h2>
          <p className={styles.subtitle}>
            {showPasswordReset ? '새로운 비밀번호를 설정해주세요' : activeTab === 'findId' ? '이메일을 찾으시나요?' : '비밀번호를 찾으시나요?'}
          </p>
          <p className={styles.description}>
            {showPasswordReset ? '안전한 비밀번호로 설정해주세요.' : '회원가입시 입력한 아래의 정보를 입력해주세요.'}
          </p>
        </div>

        {!showPasswordReset && (
          <div className={styles.tabContainer}>
            <div className={styles.tabList}>
              <button
                className={`${styles.tab} ${activeTab === 'findId' ? styles.tabActive : ''}`}
                onClick={() => handleTabChange('findId')}
              >
                이메일 찾기
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'resetPassword' ? styles.tabActive : ''}`}
                onClick={() => handleTabChange('resetPassword')}
              >
                비밀번호 재설정
              </button>
            </div>
          </div>
        )}

        {/* 아이디 찾기 성공 메시지 표시 */}
        {foundEmail && (
          <div className={styles.successContainer}>
            <div className={styles.successMessage}>
              <div className={styles.successIcon}>✓</div>
              <h3 className={styles.successTitle}>회원님의 아이디는</h3>
              <div className={styles.foundEmail}>{foundEmail}</div>
              <p className={styles.successSubtitle}>입니다</p>
            </div>
            <div className={styles.successButtons}>
              <button 
                type="button" 
                className={styles.successLoginButton}
                onClick={onClose}
              >
                로그인
              </button>
              <button 
                type="button" 
                className={styles.successCancelButton}
                onClick={onClose}
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 비밀번호 재설정 성공 - 새 비밀번호 입력 화면 */}
        {showPasswordReset && (
          <div className={styles.passwordResetContainer}>
            <div className={styles.passwordResetMessage}>
              <div className={styles.successIcon}>🔑</div>
              <h3 className={styles.successTitle}>계정이 확인되었습니다</h3>
              <p className={styles.successSubtitle}>새로운 비밀번호를 설정해주세요</p>
            </div>
            
            <form onSubmit={handlePasswordSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="newPassword" className={styles.label}>새 비밀번호</label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    ref={newPasswordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    id="newPassword"
                    className={styles.input}
                    placeholder="새 비밀번호를 입력하세요"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                    onFocus={() => setActiveInput('newPassword')}
                    required
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="confirmPassword" className={styles.label}>비밀번호 확인</label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    ref={confirmPasswordInputRef}
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    className={styles.input}
                    placeholder="비밀번호를 다시 입력하세요"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                    onFocus={() => setActiveInput('confirmPassword')}
                    required
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {passwordError && <div className={styles.errorMessage}>{passwordError}</div>}

              <div className={styles.passwordButtons}>
                <button type="submit" className={styles.confirmButton} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <LoadingSpinner />
                      변경 중...
                    </>
                  ) : (
                    <>
                      <span className={styles.buttonIcon}>✓</span>
                      확인
                    </>
                  )}
                </button>
                
                <button 
                  type="button" 
                  className={styles.cancelButton} 
                  onClick={() => setShowPasswordReset(false)}
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 기본 폼 - 성공 시 숨김 */}
        {!foundEmail && !showPasswordReset && (
          <form onSubmit={handleSubmit} className={styles.form}>
            {activeTab === 'findId' ? (
              <div className={styles.inputGroup}>
                <label 
                  htmlFor="name" 
                  className={`${styles.label} ${hasError ? styles.errorLabel : ''}`}
                >
                  이름
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  id="name"
                  className={`${styles.input} ${hasError ? styles.inputError : ''} ${hasError ? styles.inputShake : ''}`}
                  placeholder="이름을 입력하세요"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  onFocus={() => setActiveInput('name')}
                  required
                />
              </div>
            ) : (
              <div className={styles.inputGroup}>
                <label 
                  htmlFor="id" 
                  className={`${styles.label} ${hasError ? styles.errorLabel : ''}`}
                >
                  이메일
                </label>
                <input
                  ref={idInputRef}
                  type="text"
                  id="id"
                  className={`${styles.input} ${hasError && activeTab === 'resetPassword' ? styles.passwordResetInputError : hasError ? styles.inputError : ''} ${hasError ? styles.inputShake : ''}`}
                  placeholder="이메일을 입력하세요"
                  value={formData.id}
                  onChange={(e) => handleInputChange('id', e.target.value)}
                  onFocus={() => setActiveInput('id')}
                  required
                />
              </div>
            )}

            <div className={styles.inputGroup}>
              <label 
                htmlFor="phone" 
                className={`${styles.label} ${hasError ? styles.errorLabel : ''}`}
              >
                전화번호
              </label>
              <input
                ref={phoneInputRef}
                type="tel"
                id="phone"
                className={`${styles.input} ${hasError && activeTab === 'resetPassword' ? styles.passwordResetInputError : hasError ? styles.inputError : ''} ${hasError ? styles.inputShake : ''}`}
                placeholder="전화번호를 입력하세요"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                onFocus={() => setActiveInput('phone')}
                required
              />
            </div>

            {error && (
              <div className={activeTab === 'resetPassword' ? styles.passwordResetError : styles.errorMessage}>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className={`${styles.confirmButton} ${hasError && activeTab === 'resetPassword' ? styles.confirmButtonError : ''}`} 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  확인 중...
                </>
              ) : (
                <>
                  <span className={styles.buttonIcon}>→</span>
                  확인
                </>
              )}
            </button>

            <div className={styles.divider}>
              <span className={styles.dividerText}>또는</span>
            </div>

            <button type="button" className={styles.cancelButton} onClick={onClose}>
              취소
            </button>
          </form>
        )}
        
        <VirtualKeyboard
          isVisible={isKeyboardVisible}
          onToggle={handleToggleKeyboard}
          onKeyPress={handleVirtualKeyPress}
          onBackspace={handleVirtualBackspace}
          onSpace={handleVirtualSpace}
          onEnter={handleVirtualEnter}
          currentInputValue={
            activeInput === 'newPassword' ? passwordData.newPassword :
            activeInput === 'confirmPassword' ? passwordData.confirmPassword :
            activeInput ? formData[activeInput as keyof typeof formData] : ''
          }
        />
      </div>
    </div>
  );
};

export default FindAccountModal;
