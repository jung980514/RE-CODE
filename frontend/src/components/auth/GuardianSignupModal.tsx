'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './GuardianSignupModal.module.css';
import { VirtualKeyboard } from '@/components/common/VirtualKeyboard';

interface GuardianSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToSignup: () => void; // 회원가입 선택 화면으로 돌아가기 위한 함수
}

const GuardianSignupModal: React.FC<GuardianSignupModalProps> = ({ 
  isOpen, 
  onClose, 
  onBackToSignup 
}) => {
  // 모달의 표시 상태와 애니메이션 상태를 분리
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // 가상키보드 상태
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(false);
  const [activeInput, setActiveInput] = useState<string | null>(null);

  // 폼 상태 관리 - Figma 디자인에 맞춘 초기값
  const [guardianFormData, setGuardianFormData] = useState({
    name: '김싸피',
    phoneNumber: '010-3442-8244',
    birthDate: '1900/01/01',
    email: 'kco3459@naver.com',
    gender: '',
    profileImage: null as File | null,
    password: '',
    confirmPassword: '',
    agreeToPrivacy: true,
    agreeToSensitive: false
  });

  // isOpen 상태 변화에 따른 애니메이션 처리
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
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // 폼 데이터 변경 핸들러
  const handleGuardianInputChange = (field: string, value: string | boolean | File) => {
    setGuardianFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 프로필 이미지 업로드 핸들러
  const handleGuardianImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleGuardianInputChange('profileImage', file);
    }
  };

  // 가상키보드 토글 핸들러
  const handleVirtualKeyboardToggle = () => {
    setShowVirtualKeyboard(!showVirtualKeyboard);
  };

  // 입력 필드 포커스 핸들러
  const handleInputFocus = (fieldName: string) => {
    setActiveInput(fieldName);
    setShowVirtualKeyboard(true);
  };

  // 가상키보드에서 입력 처리
  const handleVirtualKeyboardInput = (key: string, replaceLast?: boolean) => {
    if (activeInput) {
      setGuardianFormData(prev => {
        const currentValue = String(prev[activeInput as keyof typeof prev]);
        const newValue = replaceLast 
          ? currentValue.slice(0, -1) + key
          : currentValue + key;
        
        return {
          ...prev,
          [activeInput]: newValue
        };
      });
    }
  };

  // 가상키보드에서 백스페이스 처리
  const handleVirtualKeyboardBackspace = () => {
    if (activeInput) {
      setGuardianFormData(prev => ({
        ...prev,
        [activeInput]: String(prev[activeInput as keyof typeof prev]).slice(0, -1)
      }));
    }
  };

  // 가상키보드에서 스페이스 처리
  const handleVirtualKeyboardSpace = () => {
    if (activeInput) {
      setGuardianFormData(prev => ({
        ...prev,
        [activeInput]: String(prev[activeInput as keyof typeof prev]) + ' '
      }));
    }
  };

  // 가상키보드에서 엔터 처리
  const handleVirtualKeyboardEnter = () => {
    setShowVirtualKeyboard(false);
  };

  // 회원가입 제출 핸들러
  const handleGuardianSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // TODO: Implement signup logic
    console.log('Guardian signup data:', guardianFormData);
  };

  // 모달이 완전히 숨겨진 상태에서는 렌더링하지 않음
  if (!isVisible) return null;

  return (
    <div 
      className={`${styles.overlay} ${isAnimating ? styles.overlayOpen : styles.overlayClose}`}
      onClick={onClose}
    >
      <div 
        className={`${styles.modal} ${isAnimating ? styles.modalOpen : styles.modalClose}`}
        onClick={e => e.stopPropagation()}
      >
        {/* 뒤로가기 화살표 */}
        <button 
          className={styles.backArrow}
          onClick={onBackToSignup}
          type="button"
        >
          ←
        </button>

        {/* 가상키보드 버튼 */}
        <button 
          className={styles.virtualKeyboardButton}
          onClick={handleVirtualKeyboardToggle}
          type="button"
        >
          <Image
            src="/icons/keyboard_icon.png"
            alt="Virtual Keyboard"
            width={24}
            height={24}
          />
        </button>

        <div className={styles.header}>
          <h2 className={styles.title}>환영합니다!</h2>
          <p className={styles.subtitle}>
            몇가지 정보만 입력하시면 바로 시작하실 수 있어요!
          </p>
        </div>

        <form onSubmit={handleGuardianSubmit} className={styles.form}>
          <div className={styles.formColumns}>
            {/* 왼쪽 열 */}
            <div className={styles.leftColumn}>
              {/* 휴대전화 번호 입력 */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>휴대전화 번호 *</label>
                <input
                  type="tel"
                  value={guardianFormData.phoneNumber}
                  onChange={(e) => handleGuardianInputChange('phoneNumber', e.target.value)}
                  onFocus={() => handleInputFocus('phoneNumber')}
                  placeholder="&apos;-&apos; 없이 입력해주세요"
                  className={styles.input}
                  required
                />
                <p className={styles.inputHint}>&apos;-&apos; 없이 입력해주세요</p>
              </div>

              {/* 비밀번호 입력 */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>비밀번호 *</label>
                <input
                  type="password"
                  value={guardianFormData.password}
                  onChange={(e) => handleGuardianInputChange('password', e.target.value)}
                  onFocus={() => handleInputFocus('password')}
                  placeholder="영문, 숫자, 특수문자 포함"
                  className={styles.input}
                  required
                />
                <p className={styles.passwordHint}>
                  8자 이상, 영문/숫자/특수문자 포함
                </p>
              </div>

              {/* 성별 입력 */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>성별 *</label>
                <select
                  value={guardianFormData.gender}
                  onChange={(e) => handleGuardianInputChange('gender', e.target.value)}
                  className={styles.select}
                  required
                >
                  <option value="">성별을 선택해주세요</option>
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                </select>
              </div>
            </div>

            {/* 오른쪽 열 */}
            <div className={styles.rightColumn}>
              {/* 프로필 사진 업로드 */}
              <div className={styles.profileSection}>
                <div className={styles.profileImageContainer}>
                  {guardianFormData.profileImage ? (
                    <Image
                      src={URL.createObjectURL(guardianFormData.profileImage)}
                      alt="Profile"
                      width={162}
                      height={165}
                      className={styles.profileImage}
                    />
                  ) : (
                    <div className={styles.profilePlaceholder}>
                      <span>👤</span>
                    </div>
                  )}
                  <button
                    type="button"
                    className={styles.uploadButton}
                    onClick={() => document.getElementById('profile-upload')?.click()}
                  >
                    ↑
                  </button>
                </div>
                <label className={styles.profileLabel}>
                  프로필 사진 (선택사항)
                </label>
                <input
                  id="profile-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleGuardianImageUpload}
                  className={styles.profileInput}
                />
              </div>

              {/* 이름 입력 */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>이름 *</label>
                <input
                  type="text"
                  value={guardianFormData.name}
                  onChange={(e) => handleGuardianInputChange('name', e.target.value)}
                  onFocus={() => handleInputFocus('name')}
                  placeholder="실명을 입력해주세요"
                  className={styles.input}
                  required
                />
                <p className={styles.inputHint}>실명을 입력해주세요</p>
              </div>

              {/* 생년월일 입력 */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>생년월일 *</label>
                <div className={styles.dateInputContainer}>
                  <input
                    type="date"
                    value={guardianFormData.birthDate}
                    onChange={(e) => handleGuardianInputChange('birthDate', e.target.value)}
                    className={styles.dateInput}
                    required
                  />
                  <div className={styles.calendarIcon}>
                    📅
                  </div>
                </div>
              </div>

              {/* 이메일 입력 */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>이메일</label>
                <input
                  type="email"
                  value={guardianFormData.email}
                  onChange={(e) => handleGuardianInputChange('email', e.target.value)}
                  onFocus={() => handleInputFocus('email')}
                  placeholder="이메일을 입력해주세요"
                  className={styles.input}
                />
              </div>

              {/* 비밀번호 확인 입력 */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>비밀번호 확인 *</label>
                <input
                  type="password"
                  value={guardianFormData.confirmPassword}
                  onChange={(e) => handleGuardianInputChange('confirmPassword', e.target.value)}
                  onFocus={() => handleInputFocus('confirmPassword')}
                  placeholder="비밀번호를 다시 입력해주세요"
                  className={styles.input}
                  required
                />
                <p className={styles.inputHint}>비밀번호를 다시 입력해주세요</p>
              </div>
            </div>
          </div>

          {/* 약관 동의 */}
          <div className={styles.agreementSection}>
            <div className={styles.agreementItem}>
              <input
                type="checkbox"
                checked={guardianFormData.agreeToPrivacy}
                onChange={(e) => handleGuardianInputChange('agreeToPrivacy', e.target.checked)}
                className={styles.checkbox}
                required
              />
              <label className={styles.agreementLabel}>
                개인정보 수집 및 이용에 동의합니다.
              </label>
              <button type="button" className={styles.viewTermsButton}>
                전문보기
              </button>
            </div>

            <div className={styles.agreementItem}>
              <input
                type="checkbox"
                checked={guardianFormData.agreeToSensitive}
                onChange={(e) => handleGuardianInputChange('agreeToSensitive', e.target.checked)}
                className={styles.checkbox}
                required
              />
              <label className={styles.agreementLabel}>
                민감정보 수집 및 이용에 동의합니다.
              </label>
              <button type="button" className={styles.viewTermsButton}>
                전문보기
              </button>
            </div>
          </div>

          {/* 버튼 그룹 */}
          <div className={styles.buttonGroup}>
            <button type="submit" className={styles.submitButton}>
              가입하기
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className={styles.cancelButton}
            >
              취소
            </button>
          </div>
        </form>

        {/* 가상키보드 */}
        {showVirtualKeyboard && (
          <VirtualKeyboard
            onKeyPress={handleVirtualKeyboardInput}
            onBackspace={handleVirtualKeyboardBackspace}
            onSpace={handleVirtualKeyboardSpace}
            onEnter={handleVirtualKeyboardEnter}
            isVisible={showVirtualKeyboard}
            onToggle={() => setShowVirtualKeyboard(false)}
            currentInputValue={activeInput ? String(guardianFormData[activeInput as keyof typeof guardianFormData]) : ''}
          />
        )}
      </div>
    </div>
  );
};

export default GuardianSignupModal; 