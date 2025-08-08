'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { UserCircle2, Calendar as CalendarIcon } from 'lucide-react';
import { submitSurvey } from '@/api/kakaoLogin';
import { SurveyData } from '@/api/kakaoLogin/types';
import styles from './page.module.css';
import PrivacyPolicyModal from "@/components/common/PrivacyPolicyModal";
import SensitivePolicyModal from '@/components/common/SensitivePolicyModal';
import Datepicker, { DateValueType } from 'react-tailwindcss-datepicker';
import { VirtualKeyboard } from '@/components/common/VirtualKeyboard';

const KakaoSetupPage: React.FC = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<'userType' | 'userInfo'>('userType');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 가상키보드 상태
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(false);
  const [activeInput, setActiveInput] = useState<string | null>(null);

  // 개인정보 동의서 모달 상태
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // 민감정보 동의서 모달 상태
  const [showSensitiveModal, setShowSensitiveModal] = useState(false);

  // 마우스 다운 시작 위치를 추적하기 위한 ref
  const mouseDownTargetRef = useRef<EventTarget | null>(null);

  // 폼 상태 관리 - 카카오 로그인용 간소화
  const [formData, setFormData] = useState({
    phoneNumber: '',
    birthDate: '',
    profileImage: null as File | null,
    userType: null as 0 | 1 | null, // 0: 노인, 1: 보호자
    agreeToPrivacy: false,
    agreeToSensitive: false
  });

  const [birthDateValue, setBirthDateValue] = useState<DateValueType>({
    startDate: null,
    endDate: null,
  });

  // 로그인 상태 확인
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userType = localStorage.getItem('userType');
    
    if (!isLoggedIn || userType !== '2') {
      // 로그인되지 않았거나 이미 설정이 완료된 사용자는 메인으로 리다이렉트
      router.replace('/');
    }
  }, [router]);

  // 폼 데이터 변경 핸들러
  const handleInputChange = (field: string, value: string | boolean | File | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBirthDateChange = (newValue: DateValueType) => {
    setBirthDateValue(newValue);
    if (newValue?.startDate) {
      // Date 객체를 YYYY-MM-DD 형식으로 변환
      const date = new Date(newValue.startDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      handleInputChange('birthDate', formattedDate);
    }
  };

  // 프로필 이미지 업로드 핸들러
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleInputChange('profileImage', file);
    }
  };

  // 가상키보드 토글 핸들러
  const handleVirtualKeyboardToggle = () => {
    setShowVirtualKeyboard(!showVirtualKeyboard);
  };

  // 가상키보드에서 입력 처리
  const handleVirtualKeyboardInput = (key: string, replaceLast?: boolean) => {
    if (activeInput) {
      setFormData((prev: typeof formData) => {
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
      setFormData((prev: typeof formData) => ({
        ...prev,
        [activeInput]: String(prev[activeInput as keyof typeof prev]).slice(0, -1)
      }));
    }
  };

  // 가상키보드에서 스페이스 처리
  const handleVirtualKeyboardSpace = () => {
    if (activeInput) {
      setFormData((prev) => ({...prev, [activeInput]: String(prev[activeInput as keyof typeof prev]) + ' '}));
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
      router.push('/');
    }
    // 다음 클릭을 위해 초기화
    mouseDownTargetRef.current = null;
  };

  // 설문조사 완료 처리
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // 필수 동의 확인
    if (!formData.agreeToPrivacy || !formData.agreeToSensitive) {
      setError('필수 동의 항목에 체크해주세요.');
      return;
    }

    // 사용자 타입 확인
    if (formData.userType === null) {
      setError('사용자 타입을 선택해주세요.');
      return;
    }

    // 필수 필드 검증
    if (!formData.phoneNumber.trim()) {
      setError('휴대전화 번호를 입력해주세요.');
      return;
    }

    if (!formData.birthDate) {
      setError('생년월일을 선택해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const surveyData: SurveyData = {
        userType: formData.userType,
        additionalInfo: {
          phoneNumber: formData.phoneNumber,
          birthDate: formData.birthDate,
          agreements: {
            personalInfo: formData.agreeToPrivacy,
            serviceTerms: formData.agreeToSensitive
          }
        }
      };

      const result = await submitSurvey(surveyData);

      if (result.success && result.user) {
        if (result.user.userType === 0) {
          router.push('/main-elder');
        } else if (result.user.userType === 1) {
          router.push('/main-guardian');
        }
      } else {
        setError(result.error || '설정 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('설정 저장 오류:', error);
      setError('설정 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 사용자 타입 선택 핸들러
  const handleUserTypeSelection = (userType: 0 | 1) => {
    handleInputChange('userType', userType);
    setCurrentStep('userInfo');
  };

  // 뒤로가기 처리
  const handleGoBack = () => {
    if (currentStep === 'userInfo') {
      setCurrentStep('userType');
      handleInputChange('userType', '');
    } else {
      handleCancel();
    }
  };

  // 취소 처리
  const handleCancel = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userType');
    localStorage.removeItem('name');
    router.replace('/');
  };

  return (
    <div 
      className={styles.container}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div 
        className={styles.modal}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.modalContent}>
          {/* 뒤로가기 화살표 */}
          <button 
            className={styles.backArrow}
            onClick={handleGoBack}
            type="button"
          >
            ←
          </button>

          {/* 가상키보드 버튼 (정보 입력 단계에서만 표시) */}
          {currentStep === 'userInfo' && (
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
          )}

          {/* 1단계: 사용자 타입 선택 */}
          {currentStep === 'userType' && (
            <>
              <div className={styles.header}>
                <h2 className={styles.title}>사용자 타입 선택</h2>
                <p className={styles.subtitle}>
                  어떤 서비스를 이용하실 예정인가요?
                </p>
              </div>

              <div className={styles.userTypeSelectionContainer}>
                <div 
                  className={`${styles.userTypeOptionLarge} ${formData.userType === 0 ? styles.selected : ''}`}
                  onClick={() => handleUserTypeSelection(0)}
                >
                  <div className={styles.userTypeIconLarge}>👵</div>
                  <h3 className={styles.userTypeTitleLarge}>노인</h3>
                  <p className={styles.userTypeDescriptionLarge}>
                    인지 훈련과 건강 관리 서비스를 이용하겠습니다
                  </p>
                </div>

                <div 
                  className={`${styles.userTypeOptionLarge} ${formData.userType === 1 ? styles.selected : ''}`}
                  onClick={() => handleUserTypeSelection(1)}
                >
                  <div className={styles.userTypeIconLarge}>👨‍👩‍👧‍👦</div>
                  <h3 className={styles.userTypeTitleLarge}>보호자</h3>
                  <p className={styles.userTypeDescriptionLarge}>
                    가족의 건강 상태를 모니터링하고 관리하겠습니다
                  </p>
                </div>
              </div>

              {error && <p className={styles.errorMessage}>{error}</p>}

              <div className={styles.buttonGroup}>
                <div></div> {/* 빈 공간 */}
                <button 
                  type="button" 
                  onClick={handleCancel}
                  className={styles.cancelButton}
                >
                  취소
                </button>
              </div>
            </>
          )}

          {/* 2단계: 상세 정보 입력 */}
          {currentStep === 'userInfo' && (
            <>
              <div className={styles.header}>
                <h2 className={styles.title}>
                  {formData.userType === 0 ? '노인' : '보호자'} 정보 입력
                </h2>
                <p className={styles.subtitle}>
                  몇가지 정보만 입력하시면 바로 시작하실 수 있어요!
                </p>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                {/* 프로필 사진 섹션 */}
                <div className={styles.profileSectionStandalone}>
                  <div className={styles.profileSection}>
                    <div 
                      className={styles.profileImageContainer}
                      onClick={() => document.getElementById('profile-upload')?.click()}
                    >
                      {formData.profileImage ? (
                        <Image
                          src={URL.createObjectURL(formData.profileImage)}
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
                      onChange={handleImageUpload}
                      className={styles.profileInput}
                    />
                  </div>
                </div>

                {/* 휴대전화와 생년월일을 가로로 배치 */}
                <div className={styles.formColumns}>
                  {/* 휴대전화 번호 */}
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>휴대전화 번호 *</label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      onFocus={() => setActiveInput('phoneNumber')}
                      placeholder="'-' 없이 입력해주세요."
                      className={styles.input}
                      required
                    />
                  </div>

                  {/* 생년월일 */}
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>생년월일 *</label>
                    <Datepicker
                      i18n="ko"
                      asSingle={true}
                      useRange={false}
                      value={birthDateValue}
                      onChange={(value) => handleBirthDateChange(value)}
                      placeholder="생년월일을 선택해주세요."
                      inputClassName={styles.input}
                      toggleClassName="absolute right-3 top-1/2 -translate-y-1/2"
                      toggleIcon={() => <CalendarIcon className="h-6 w-6 text-gray-500" />}
                      displayFormat="YYYY/MM/DD"
                      primaryColor="blue"
                      containerClassName="relative w-full"
                    />
                  </div>
                </div>

                {/* 약관 동의 */}
                <div className={styles.agreementSection}>
                  <div className={styles.agreementItem}>
                    <input
                      id="agreeToPrivacy"
                      type="checkbox"
                      checked={formData.agreeToPrivacy}
                      onChange={(e) => handleInputChange('agreeToPrivacy', e.target.checked)}
                      className={styles.checkbox}
                      required
                    />
                    <label 
                      htmlFor="agreeToPrivacy"
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
                      id="agreeToSensitive"
                      type="checkbox"
                      checked={formData.agreeToSensitive}
                      onChange={(e) => handleInputChange('agreeToSensitive', e.target.checked)}
                      className={styles.checkbox}
                      required
                    />
                    <label 
                      htmlFor="agreeToSensitive"
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
                {error && <p className={styles.errorMessage}>{error}</p>}

                {/* 버튼 그룹 */}
                <div className={styles.buttonGroup}>
                  <button type="submit" className={styles.submitButton} disabled={isLoading}>
                    {isLoading ? '처리 중...' : '가입하기'}
                  </button>
                  <button 
                    type="button" 
                    onClick={handleGoBack}
                    className={styles.cancelButton}
                  >
                    이전
                  </button>
                </div>
              </form>
            </>
          )}
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
        currentInputValue={activeInput ? String(formData[activeInput as keyof typeof formData]) : ''}
      />
      <PrivacyPolicyModal open={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
      <SensitivePolicyModal open={showSensitiveModal} onClose={() => setShowSensitiveModal(false)} />
    </div>
  );
};

export default KakaoSetupPage;
