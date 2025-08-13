'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { UserCircle2 } from 'lucide-react';
import styles from './GuardianSignupModal.module.css';
import PrivacyPolicyModal from "@/components/common/PrivacyPolicyModal";
import SensitivePolicyModal from '@/components/common/SensitivePolicyModal';
import { register } from '@/api/register';
import SignUpSuccessModal from './sign-up-success-modal';
import { VirtualKeyboard } from '@/components/common/VirtualKeyboard';

// flatpickr는 클라이언트에서 동적 로드하여 초기화합니다


// jQuery datepicker 타입은 제거합니다

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

  // API 요청 상태
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 가상키보드 상태
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(false);
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);
  const birthInputRef = useRef<HTMLInputElement>(null);
  type FlatpickrController = { destroy: () => void } | null;
  const flatpickrRef = useRef<FlatpickrController>(null);

  // 개인정보 동의서 모달 상태
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // 민감정보 동의서 모달 상태
  const [showSensitiveModal, setShowSensitiveModal] = useState(false);

  // 마우스 다운 시작 위치를 추적하기 위한 ref
  const mouseDownTargetRef = useRef<EventTarget | null>(null);

  // 폼 상태 관리 - Figma 디자인에 맞춘 초기값
  const [guardianFormData, setGuardianFormData] = useState({
    name: '',
    phoneNumber: '',
    birthDate: '',
    email: '',
    gender: '',
    profileImage: null as File | null,
    password: '',
    confirmPassword: '',
    agreeToPrivacy: false,
    agreeToSensitive: false
  });

  // flatpickr 초기화 (입력이 렌더된 뒤 초기화)
  useEffect(() => {
    let isMounted = true;
    let inputEl: HTMLInputElement | null = null;

    const init = async () => {
      if (!isVisible) return;
      await new Promise((r) => setTimeout(r, 0));
      if (!birthInputRef.current) return;

      inputEl = birthInputRef.current;

      try {
        const fpModule = await import('flatpickr');
        const localeModule = await import('flatpickr/dist/l10n/ko.js');
        const flatpickr = (fpModule as { default: (el: HTMLElement, opts?: unknown) => { destroy: () => void } }).default;
        const Korean = (localeModule as { Korean: unknown }).Korean;

        // 기존 인스턴스 제거
        if (flatpickrRef.current) {
          try { flatpickrRef.current.destroy(); } catch {}
          flatpickrRef.current = null;
        }

        flatpickrRef.current = flatpickr(inputEl, {
          dateFormat: 'Y-m-d',
          maxDate: 'today',
          locale: Korean,
          allowInput: false,
          onChange: (_selectedDates: Date[], dateStr: string) => {
            handleGuardianInputChange('birthDate', dateStr || '');
          },
        });
      } catch (e) {
        // 초기화 실패 시 콘솔 경고만 남김
        console.warn('flatpickr 초기화 실패', e);
      }
    };

    void init();

    return () => {
      isMounted = false;
      try {
        if (flatpickrRef.current) {
          flatpickrRef.current.destroy();
          flatpickrRef.current = null;
        }
      } catch {}
    };
  }, [isVisible]);

  
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
        setShowVirtualKeyboard(false); // 모달이 닫힐 때 키보드도 닫기
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

  // react-tailwindcss-datepicker 사용 제거. 값 업데이트는 changeDate 이벤트에서 처리

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

  const focusActiveInput = () => {
    setTimeout(() => {
      if (!activeInput) return;
      let el: HTMLInputElement | null = null;
      switch (activeInput) {
        case 'name':
          el = nameInputRef.current;
          break;
        case 'phoneNumber':
          el = phoneInputRef.current;
          break;
        case 'email':
          el = emailInputRef.current;
          break;
        case 'password':
          el = passwordInputRef.current;
          break;
        case 'confirmPassword':
          el = confirmPasswordInputRef.current;
          break;
        default:
          el = null;
      }
      if (el) {
        el.focus();
        const len = el.value.length;
        try {
          el.setSelectionRange(len, len);
        } catch {}
      }
    }, 0);
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
      focusActiveInput();
    }
  };

  // 가상키보드에서 백스페이스 처리
  const handleVirtualKeyboardBackspace = () => {
    if (activeInput) {
      setGuardianFormData((prev: typeof guardianFormData) => ({
        ...prev,
        [activeInput]: String(prev[activeInput as keyof typeof prev]).slice(0, -1)
      }));
      focusActiveInput();
    }
  };

  // 가상키보드에서 스페이스 처리
  const handleVirtualKeyboardSpace = () => {
    if (activeInput) {
      setGuardianFormData((prev) => ({...prev, [activeInput]: String(prev[activeInput as keyof typeof prev]) + ' '}));
      focusActiveInput();
    }
  };

  // 가상키보드에서 엔터 처리
  const handleVirtualKeyboardEnter = () => {
    setShowVirtualKeyboard(false);
  };

  // 다른 모달(약관/성공) 열리면 가상키보드 닫기 및 활성 입력 해제
  useEffect(() => {
    if (showPrivacyModal || showSensitiveModal || showSuccessModal) {
      setShowVirtualKeyboard(false);
      setActiveInput(null);
    }
  }, [showPrivacyModal, showSensitiveModal, showSuccessModal]);

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

  // 파일을 Base64로 변환하는 함수
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('파일 변환에 실패했습니다.'));
        }
      };
      reader.onerror = () => reject(new Error('파일 읽기에 실패했습니다.'));
      reader.readAsDataURL(file);
    });
  };

  // 회원가입 제출 핸들러
  const handleGuardianSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (guardianFormData.password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    if (guardianFormData.password !== guardianFormData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 프로필 이미지를 Base64로 변환
      let profileImageFile = undefined;
      if (guardianFormData.profileImage) {
        try {
          profileImageFile = await convertFileToBase64(guardianFormData.profileImage);
        } catch (error) {
          console.error('프로필 이미지 변환 실패:', error);
          setError('프로필 이미지 처리에 실패했습니다.');
          setIsLoading(false);
          return;
        }
      }

      const apiData = {
        name: guardianFormData.name,
        email: guardianFormData.email,
        password: guardianFormData.password,
        phone: guardianFormData.phoneNumber,
        birthDate: guardianFormData.birthDate, // Datepicker는 YYYY-MM-DD 형식으로 값을 제공합니다.
        role: 'GUARDIAN' as const,
        profileImageFile: profileImageFile, // Base64 문자열로 변환된 프로필 이미지
      };

      const response = await register(apiData);
      console.log('회원가입 성공:', response);
      setShowSuccessModal(true);
    } catch (err) {
      // err이 Error 인스턴스인지 확인하여 타입 안전성 확보
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
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
            <div className={styles.profileSection}>
              <div 
                className={styles.profileImageContainer}
                onClick={() => document.getElementById('profile-upload')?.click()}
              >
                {guardianFormData.profileImage ? (
                  <Image
                    src={URL.createObjectURL(guardianFormData.profileImage)}
                    alt="Profile"
                    width={140}
                    height={140}
                    className={styles.profileImage}
                    style={{ objectFit: 'contain' }}
                    priority
                  />
                ) : (
                  <div className={styles.profilePlaceholder}>
                    <UserCircle2 className={styles.profilePlaceholderIcon} />
                  </div>
                )}
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
            <div className={styles.inputGroup}>
              <label className={styles.label}>이름 *</label>
              <input
                type="text"
                ref={nameInputRef}
                onFocus={() => setActiveInput('name')}
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
                ref={phoneInputRef}
                onFocus={() => setActiveInput('phoneNumber')}
                value={guardianFormData.phoneNumber}
                onChange={(e) => handleGuardianInputChange('phoneNumber', e.target.value)}
                placeholder="&apos;-&apos; 없이 입력해주세요."
                className={styles.input}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>생년월일 *</label>
              <div className="relative w-full">
                <input
                  type="text"
                  ref={birthInputRef}
                  value={guardianFormData.birthDate}
                  onChange={(e) => handleGuardianInputChange('birthDate', e.target.value)}
                  placeholder="생년월일을 선택해주세요."
                  className={styles.input}
                  readOnly
                />
              </div>
            </div>

            {/* 3행: 비밀번호(왼) - 이메일(오) */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>비밀번호 *</label>
              <input
                type="password"
                ref={passwordInputRef}
                onFocus={() => setActiveInput('password')}
                value={guardianFormData.password}
                onChange={(e) => handleGuardianInputChange('password', e.target.value)}
                placeholder="영문, 숫자, 특수문자 포함 8자 이상"
                className={styles.input}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>비밀번호 확인 *</label>
              <input
                type="password"
                ref={confirmPasswordInputRef}
                onFocus={() => setActiveInput('confirmPassword')}
                value={guardianFormData.confirmPassword}
                onChange={(e) => handleGuardianInputChange('confirmPassword', e.target.value)}
                placeholder="비밀번호를 다시 입력해주세요"
                className={styles.input}
                required
              />
            </div>

            {/* 4행: 성별(왼) - 비밀번호 확인(오) */}
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
            <div className={styles.inputGroup}>
              <label className={styles.label}>이메일</label>
              <input
                type="email"
                ref={emailInputRef}
                onFocus={() => setActiveInput('email')}
                value={guardianFormData.email}
                onChange={(e) => handleGuardianInputChange('email', e.target.value)}
                placeholder="이메일을 입력해주세요"
                className={styles.input}
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

          {/* 에러 메시지 표시 */}
          {error && <p className="text-red-500 text-center font-bold text-2xl">{error}</p>}

          {/* 버튼 그룹 */}
          <div className={styles.buttonGroup}>
            <button type="submit" className={styles.submitButton} disabled={isLoading}>
              {isLoading ? '가입 중...' : '가입하기'}
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
      <SignUpSuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          onClose();
        }}
      />
    </div>
  );
};

export default GuardianSignupModal; 