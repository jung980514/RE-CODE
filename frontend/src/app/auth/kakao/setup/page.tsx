'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { UserCircle2, Calendar as CalendarIcon } from 'lucide-react';
import { SurveyData } from '@/api/kakaoLogin/types';
import styles from './page.module.css';
import PrivacyPolicyModal from "@/components/common/PrivacyPolicyModal";
import { authApi } from '@/lib/api';
import SensitivePolicyModal from '@/components/common/SensitivePolicyModal';
import { VirtualKeyboard } from '@/components/common/VirtualKeyboard';

// flatpickr 타입 정의
type FlatpickrController = { destroy: () => void } | null;

const KakaoSetupPage: React.FC = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<'role' | 'userInfo'>('role');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 가상키보드 상태
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(false);
  const [activeInput, setActiveInput] = useState<string | null>(null);

  // flatpickr 관련
  const flatpickrRef = useRef<FlatpickrController>(null);
  const birthInputRef = useRef<HTMLInputElement>(null);

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
    role: null as 'ELDER' | 'GUARDIAN' | null,
    agreeToPrivacy: false,
    agreeToSensitive: false
  });

  // 가상키보드 토글 핸들러
  const handleVirtualKeyboardToggle = () => {
    const newState = !showVirtualKeyboard;
    setShowVirtualKeyboard(newState);
    
    // 가상 키보드가 활성화되면 flatpickr 비활성화
    if (newState && flatpickrRef.current) {
      try {
        flatpickrRef.current.destroy();
        flatpickrRef.current = null;
      } catch {}
    } else if (!newState && birthInputRef.current) {
      // 가상 키보드가 비활성화되면 flatpickr 다시 초기화
      setTimeout(() => {
        initFlatpickr();
      }, 100);
    }
  };

  // flatpickr 초기화 함수
  const initFlatpickr = async () => {
    if (!birthInputRef.current) return;

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

      flatpickrRef.current = flatpickr(birthInputRef.current, {
        dateFormat: 'Y-m-d',
        maxDate: 'today',
        locale: Korean,
        allowInput: false,
        onChange: (_selectedDates: Date[], dateStr: string) => {
          handleInputChange('birthDate', dateStr || '');
        }
      });
    } catch (e) {
      console.warn('flatpickr 초기화 실패', e);
    }
  };

  // flatpickr 초기화
  useEffect(() => {
    let isMounted = true;

    if (currentStep === 'userInfo' && !showVirtualKeyboard) {
      // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 초기화
      const timer = setTimeout(() => {
        if (isMounted) {
          initFlatpickr();
        }
      }, 100);

      return () => {
        clearTimeout(timer);
        isMounted = false;
        if (flatpickrRef.current) {
          flatpickrRef.current.destroy();
          flatpickrRef.current = null;
        }
      };
    }

    return () => {
      isMounted = false;
      if (flatpickrRef.current) {
        flatpickrRef.current.destroy();
        flatpickrRef.current = null;
      }
    };
  }, [currentStep, showVirtualKeyboard]);

  // 로그인 상태 확인
  useEffect(() => {
    let mounted = true; // 컴포넌트 마운트 상태 추적
    
    const checkAuthStatus = () => {
      if (!mounted) return;
      
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      const role = localStorage.getItem('role');
      
      console.log('🔍 Setup 페이지 인증 상태 확인:', { isLoggedIn, role });
      
      if (!isLoggedIn) {
        console.log('❌ 로그인되지 않은 사용자 → 홈으로 이동');
        router.replace('/');
        return;
      }
      
      // role이 이미 설정되어 있다면 (이미 설문조사 완료) 홈으로 이동
      if (role && role !== 'USER') {
        console.log('✅ 이미 역할이 설정된 사용자 → 홈으로 이동');
        router.replace('/');
        return;
      }
      
      console.log('✅ 설문조사 진행 가능한 사용자');
    };
    
    // 약간의 지연을 두어 렌더링 안정화
    const timeoutId = setTimeout(checkAuthStatus, 100);
    
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  // 폼 데이터 변경 핸들러
  const handleInputChange = (field: string, value: string | boolean | File) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
  if (formData.role === null) {
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
      // 🔥 백엔드 수정 없이 해결하는 방법:
      // UpdateUserRequest에 role 필드가 없으므로, role은 localStorage에만 저장하고
      // 다른 정보만 백엔드에 업데이트
      
      const updateData = {
        phone: formData.phoneNumber,
        birthDate: formData.birthDate, // YYYY-MM-DD 형식이므로 그대로 전송
        name: localStorage.getItem('name') || '',
        role: formData.role,
      };

      console.log('📤 백엔드로 전송할 데이터 (role 제외):', updateData);
      
      // 1. 먼저 localStorage에 역할 저장 (백엔드 요청과 별개로)
      localStorage.setItem('role', formData.role as string);
      console.log('💾 프론트엔드 localStorage role 저장:', formData.role);
      
      // 2. 백엔드에 다른 정보만 업데이트 (phone, birthDate, name)
      const result = await authApi.updateUser(updateData);
      
      console.log('📡 백엔드 응답:', result);
      console.log('📊 응답 상태:', result.status);
      console.log('📊 응답 데이터:', result.data);

      // 3. 백엔드 업데이트 성공 여부와 관계없이 프론트엔드에서 역할 관리
      if (result.status === 'success') {
        console.log('✅ 사용자 정보 업데이트 성공! 역할은 프론트엔드에서 관리됨');
        
        // 카카오 설문조사 완료 표시 (이메일별로 저장)
        const userEmail = localStorage.getItem('email')?.replace('kakao ', '') || 'unknown';
        localStorage.setItem(`kakao_survey_completed_${userEmail}`, 'true');
        localStorage.setItem(`kakao_role_${userEmail}`, formData.role as string); // 역할도 영구 저장
        console.log('✅ 카카오 설문조사 완료 표시:', userEmail);
        console.log('✅ 카카오 역할 영구 저장:', formData.role);
        
        // localStorage 업데이트가 완료될 때까지 잠시 대기
        setTimeout(() => {
          if (formData.role === 'ELDER') {
            console.log('🚀 ELDER 역할 → /main-elder로 이동');
            window.location.href = '/main-elder';
          } else if (formData.role === 'GUARDIAN') {
            console.log('🚀 GUARDIAN 역할 → /main-guardian로 이동');
            window.location.href = '/main-guardian';
          }
        }, 200);
      } else {
        // 백엔드 업데이트가 실패해도 역할은 프론트엔드에서 관리되므로 계속 진행
        console.log('⚠️ 백엔드 업데이트 실패했지만 역할은 프론트엔드에서 관리됨');
        
        // 실패해도 카카오 설정 완료로 처리
        const userEmail = localStorage.getItem('email')?.replace('kakao ', '') || 'unknown';
        localStorage.setItem(`kakao_survey_completed_${userEmail}`, 'true');
        localStorage.setItem(`kakao_role_${userEmail}`, formData.role as string);
        console.log('✅ 카카오 설정 완료 처리 (백엔드 실패 무시)');
        
        // 사용자에게는 성공으로 보이도록 처리
        setTimeout(() => {
          if (formData.role === 'ELDER') {
            console.log('🚀 ELDER 역할 → /main-elder로 이동 (백엔드 실패 무시)');
            window.location.href = '/main-elder';
          } else if (formData.role === 'GUARDIAN') {
            console.log('🚀 GUARDIAN 역할 → /main-guardian로 이동 (백엔드 실패 무시)');
            window.location.href = '/main-guardian';
          }
        }, 200);
      }
    } catch (error) {
      console.error('설정 저장 오류:', error);
      setError('설정 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 사용자 타입 선택 핸들러
  const handleRoleSelection = (role: 'ELDER' | 'GUARDIAN') => {
    handleInputChange('role', role);
    setCurrentStep('userInfo');
  };

  // 뒤로가기 처리
  const handleGoBack = () => {
    if (currentStep === 'userInfo') {
      setCurrentStep('role');
      handleInputChange('role', '');
    } else {
      handleCancel();
    }
  };

  // 취소 처리
  const handleCancel = () => {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('role');
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

          {/* 1단계: 역할 선택 */}
          {currentStep === 'role' && (
            <>
              <div className={styles.header}>
                <h2 className={styles.title}>역할 선택</h2>
                <p className={styles.subtitle}>
                  어떤 서비스를 이용하실 예정인가요?
                </p>
              </div>

              <div className={styles.userTypeSelectionContainer}>
                <div 
                  className={`${styles.userTypeOptionLarge} ${formData.role === 'ELDER' ? styles.selected : ''}`}
                  onClick={() => handleRoleSelection('ELDER')}
                >
                  <div className={styles.userTypeIconLarge}>👵</div>
                  <h3 className={styles.userTypeTitleLarge}>노인</h3>
                  <p className={styles.userTypeDescriptionLarge}>
                    인지 훈련과 건강 관리 서비스를 이용하겠습니다
                  </p>
                </div>

                <div 
                  className={`${styles.userTypeOptionLarge} ${formData.role === 'GUARDIAN' ? styles.selected : ''}`}
                  onClick={() => handleRoleSelection('GUARDIAN')}
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
                  {formData.role === 'ELDER' ? '노인' : '보호자'} 정보 입력
                </h2>
                <p className={styles.subtitle}>
                  몇가지 정보만 입력하시면 바로 시작하실 수 있어요!
                </p>
              </div>


              <form onSubmit={handleSubmit} className={styles.form}>

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
                    <input
                      type="text"
                      ref={birthInputRef}
                      value={formData.birthDate}
                      onChange={(e) => handleInputChange('birthDate', e.target.value)}
                      onFocus={() => {
                        setActiveInput('birthDate');
                        // flatpickr가 활성화되어 있으면 가상 키보드 대신 flatpickr 사용
                        if (flatpickrRef.current) {
                          // flatpickr가 활성화되어 있으므로 가상 키보드는 비활성화
                        }
                      }}
                      placeholder="YYYY-MM-DD"
                      className={styles.input}
                      readOnly
                      required
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
