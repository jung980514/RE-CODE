'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { UserCircle2, Calendar as CalendarIcon } from 'lucide-react';
import styles from './GuardianSignupModal.module.css';
import PrivacyPolicyModal from "@/components/common/PrivacyPolicyModal";
import SensitivePolicyModal from '@/components/common/SensitivePolicyModal';
import Datepicker from 'react-tailwindcss-datepicker';
import { VirtualKeyboard } from '@/components/common/VirtualKeyboard';
import { register } from '@/lib/auth';


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

  // 개인정보 동의서 모달 상태
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // 민감정보 동의서 모달 상태
  const [showSensitiveModal, setShowSensitiveModal] = useState(false);

  // 마우스 다운 시작 위치를 추적하기 위한 ref
  const mouseDownTargetRef = useRef<EventTarget | null>(null);

  // 폼 상태 관리 - 백엔드 API와 호환되는 초기값
  const [guardianFormData, setGuardianFormData] = useState({
    name: '',
    phone: '',
    birthDate: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToPrivacy: false,
    agreeToSensitive: false
  });

  const [birthDateValue, setBirthDateValue] = useState<{ startDate: string | null; endDate: string | null }>({
    startDate: null,
    endDate: null,
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
      setShowVirtualKeyboard(false); 

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

  const handleBirthDateChange = (newValue: { startDate: string | null; endDate: string | null } | null) => {
    setBirthDateValue(newValue);
    if (newValue) {
      handleGuardianInputChange('birthDate', newValue.startDate || '');
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
      setGuardianFormData((prev: typeof guardianFormData) => {
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
      setGuardianFormData((prev: typeof guardianFormData) => ({
        ...prev,
        [activeInput]: String(prev[activeInput as keyof typeof prev]).slice(0, -1)
      }));
    }
  };

  // 가상키보드에서 스페이스 처리
  const handleVirtualKeyboardSpace = () => {
    if (activeInput) {
      setGuardianFormData((prev) => ({...prev, [activeInput]: String(prev[activeInput as keyof typeof prev]) + ' '}));
    }
  };

  // 가상키보드에서 엔터 처리
  const handleVirtualKeyboardEnter = () => {
    setShowVirtualKeyboard(false);
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

  // 회원가입 제출 핸들러
  const handleGuardianSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // 비밀번호 확인
    if (guardianFormData.password !== guardianFormData.confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    // 필수 필드 검증
    if (!guardianFormData.name || !guardianFormData.email || !guardianFormData.password || 
        !guardianFormData.phone || !guardianFormData.birthDate) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }

    // 약관 동의 확인
    if (!guardianFormData.agreeToPrivacy || !guardianFormData.agreeToSensitive) {
      alert('모든 약관에 동의해주세요.');
      return;
    }

    try {
      const result = await register({
        name: guardianFormData.name,
        email: guardianFormData.email,
        password: guardianFormData.password,
        phone: guardianFormData.phone,
        birthDate: guardianFormData.birthDate,
        role: 'GUARDIAN'
      });
      
      alert('회원가입이 완료되었습니다.');
      onClose();
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message || '회원가입에 실패했습니다.');
      } else {
        alert('알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  // 모달이 완전히 숨겨진 상태에서는 렌더링하지 않음
  if (!isVisible) return null;

  return (
    <div 
      className={`${styles.overlay} ${isAnimating ? styles.overlayOpen : styles.overlayClose}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div 
        className={`${styles.modal} ${isAnimating ? styles.modalOpen : styles.modalClose}`}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.modalContent}>
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
            width={52}
            height={52}
          />
        </button>

        <div className={styles.header}>
          <h2 className={styles.title}>보호자 회원가입</h2>
          <p className={styles.subtitle}>
            몇가지 정보만 입력하시면 바로 시작하실 수 있어요!
          </p>
        </div>

        <form onSubmit={handleGuardianSubmit} className={styles.form}>
          <div className={styles.formColumns}>
            {/* 1행: 이름 */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>이름 *</label>
              <input
                type="text"
                value={guardianFormData.name}
                onChange={(e) => handleGuardianInputChange('name', e.target.value)}
                placeholder="이름을 입력해주세요."
                className={styles.input}
                required
              />
            </div>

            {/* 2행: 휴대전화(왼) - 생년월일(오) */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>휴대전화 번호 *</label>
              <input
                type="tel"
                value={guardianFormData.phone}
                onChange={(e) => handleGuardianInputChange('phone', e.target.value)}
                placeholder="&apos;-&apos; 없이 입력해주세요."
                className={styles.input}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>생년월일 *</label>
              <Datepicker
                i18n="ko"
                asSingle={true}
                useRange={false}
                value={birthDateValue}
                onChange={handleBirthDateChange}
                placeholder="생년월일을 선택해주세요."
                inputClassName={styles.input}
                toggleClassName="absolute right-3 top-1/2 -translate-y-1/2"
                toggleIcon={() => <CalendarIcon className="h-6 w-6 text-gray-500" />}
                displayFormat="YYYY/MM/DD"
                primaryColor="blue"
                containerClassName="relative w-full"
              />
            </div>

            {/* 3행: 비밀번호(왼) - 이메일(오) */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>비밀번호 *</label>
              <input
                type="password"
                value={guardianFormData.password}
                onChange={(e) => handleGuardianInputChange('password', e.target.value)}
                placeholder="영문, 숫자, 특수문자 포함 8자 이상"
                className={styles.input}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>이메일 *</label>
              <input
                type="email"
                value={guardianFormData.email}
                onChange={(e) => handleGuardianInputChange('email', e.target.value)}
                placeholder="이메일을 입력해주세요"
                className={styles.input}
                required
              />
            </div>

            {/* 4행: 비밀번호 확인 */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>비밀번호 확인 *</label>
              <input
                type="password"
                value={guardianFormData.confirmPassword}
                onChange={(e) => handleGuardianInputChange('confirmPassword', e.target.value)}
                placeholder="비밀번호를 다시 입력해주세요"
                className={styles.input}
                required
              />
            </div>
          </div>

          {/* 약관 동의 */}
          <div className={styles.agreementSection}>
            <div className={styles.agreementItem}>
              <input
                id="agreeToPrivacy" // id 추가
                type="checkbox"
                checked={guardianFormData.agreeToPrivacy}
                onChange={(e) => handleGuardianInputChange('agreeToPrivacy', e.target.checked)}
                className={styles.checkbox}
                required
              />
              <label 
                htmlFor="agreeToPrivacy" // htmlFor로 input과 연결
                className={styles.agreementLabel}
              >
                개인정보 수집 및 이용에 동의합니다.
              </label>
              <button type="button" className={styles.viewTermsButton} onClick={() => setShowPrivacyModal(true)}>
                전문보기
              </button>
            </div>


<div className={styles.agreementItem}>
  <input
    id="agreeToSensitive" // id 추가
    type="checkbox"
    checked={guardianFormData.agreeToSensitive}
    onChange={(e) => handleGuardianInputChange('agreeToSensitive', e.target.checked)}
    className={styles.checkbox}
    required
  />
  <label 
    htmlFor="agreeToSensitive" // htmlFor로 input과 연결
    className={styles.agreementLabel}
  >
    민감정보 수집 및 이용에 동의합니다.
  </label>
  <button type="button" className={styles.viewTermsButton} onClick={() => setShowSensitiveModal(true)}>
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
        </div>
      </div>
      {/* 가상키보드를 오버레이 레벨에 배치하여 모달 외부로 나갈 수 있도록 함 */}
      <VirtualKeyboard
        isVisible={showVirtualKeyboard}
        onToggle={handleVirtualKeyboardToggle}
        onKeyPress={handleVirtualKeyboardInput}
        onBackspace={handleVirtualKeyboardBackspace}
        onSpace={handleVirtualKeyboardSpace}
        onEnter={handleVirtualKeyboardEnter}
        currentInputValue={activeInput ? String(guardianFormData[activeInput as keyof typeof guardianFormData]) : ''}
      />
      <PrivacyPolicyModal open={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
      <SensitivePolicyModal open={showSensitiveModal} onClose={() => setShowSensitiveModal(false)} />
    </div>
  );
};

export default GuardianSignupModal; 