"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Users } from 'lucide-react';
import Image from 'next/image';
import { AccountDeletionModal } from './account-deletion-modal';
import { WithdrawalSuccessModal } from './withdrawal-success-modal';
import { VirtualKeyboard } from '@/components/common/VirtualKeyboard';

export default function UserInfoPage() {
  const router = useRouter();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [activeInput, setActiveInput] = useState<'currentPassword' | 'newPassword' | 'confirmPassword' | null>(null);
  const currentPasswordRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    birthDate: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    email: '',
  });



  const [deletePassword, setDeletePassword] = useState('');
  const [showWithdrawalSuccess, setShowWithdrawalSuccess] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('https://recode-my-life.site/api/user/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // 세션 쿠키를 포함하여 요청
        });

        if (response.ok) {
          const result = await response.json();
          if (result.status === 'success' && result.data) {
            setFormData(prev => ({
              ...prev,
              name: result.data.name || '',
              phoneNumber: result.data.phone || '',
              birthDate: result.data.birthDate || '',
              email:result.data.email || '',
            }));
          }
        } else {
          console.error('Failed to fetch user info');
          alert('사용자 정보를 불러오는데 실패했습니다. 다시 로그인해주세요.');
          router.push('/');
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };
    
    // 회원탈퇴 비밀번호 이벤트 리스너
    const handleDeletePasswordEvent = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setDeletePassword(customEvent.detail);
    };
    
    window.addEventListener('account-delete-password', handleDeletePasswordEvent);
    fetchUserInfo();
    
    return () => {
      window.removeEventListener('account-delete-password', handleDeletePasswordEvent);
    };
  }, [router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // const handleSaveProfile = () => {
  //   // 프로필 저장 로직
  //   console.log('프로필 저장:', formData);
  //   alert('프로필이 저장되었습니다.');
  // };



  const handleSaveProfile = async () => {
    try {
      // 비밀번호 변경 여부 확인 (실제로 새 비밀번호를 입력했을 때만)
      const isChangingPassword = formData.newPassword && formData.newPassword.trim().length > 0;
      
      if (isChangingPassword) {
        // 현재 비밀번호 확인
        if (!formData.currentPassword || formData.currentPassword.trim() === '') {
          alert('비밀번호를 변경하려면 현재 비밀번호를 입력해주세요.');
          return;
        }

        // 새 비밀번호 길이 확인
        if (formData.newPassword.trim().length < 8) {
          alert('새 비밀번호는 8자 이상이어야 합니다.');
          return;
        }

        // 비밀번호 확인 체크
        if (formData.newPassword.trim() !== formData.confirmPassword.trim()) {
          alert('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
          return;
        }
      }

      // API 요청 데이터 구성
      const updateData: {
        name?: string;
        phone?: string;
        currentPassword?: string;
        newPassword?: string;
      } = {};
      
      // 이름이 변경된 경우
      if (formData.name && formData.name.trim() !== '') {
        updateData.name = formData.name.trim();
      }

      // 전화번호가 변경된 경우  
      if (formData.phoneNumber && formData.phoneNumber.trim() !== '') {
        const phoneNumber = formData.phoneNumber.trim();
        
        // 전화번호 형식 검증
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(phoneNumber.replace(/[^0-9]/g, ''))) {
          alert('올바른 휴대전화 번호를 입력해주세요. (10-11자리 숫자)');
          return;
        }
        
        updateData.phone = phoneNumber;
      }

      // 비밀번호 변경이 요청된 경우 (실제로 비밀번호를 변경할 때만)
      if (isChangingPassword) {
        updateData.currentPassword = formData.currentPassword.trim();
        updateData.newPassword = formData.newPassword.trim();
      }

      // API 호출
      const response = await fetch('https://recode-my-life.site/api/user/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          alert('프로필이 성공적으로 저장되었습니다.');
          
          // 비밀번호 변경이 성공한 경우 필드 초기화
          if (isChangingPassword) {
            setFormData(prev => ({
              ...prev,
              currentPassword: '',
              newPassword: '',
              confirmPassword: '',
            }));
          }
        } else {
          alert(`프로필 저장에 실패했습니다: ${result.message || '알 수 없는 오류'}`);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        
        // 에러 메시지 처리
        let errorMessage = '프로필 저장에 실패했습니다.';
        if (errorData.message) {
          errorMessage += ` ${errorData.message}`;
        } else if (response.status === 400) {
          errorMessage += ' 입력값을 확인해주세요.';
        } else if (response.status === 401) {
          errorMessage += ' 인증이 필요합니다. 다시 로그인해주세요.';
        } else if (response.status === 403) {
          errorMessage += ' 현재 비밀번호가 올바르지 않습니다.';
        }
        
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('프로필 저장 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.');
    }
  };

  const handleConfirmWithdrawal = async () => {
    try {
      // 비밀번호가 없으면 에러
      if (!deletePassword || deletePassword.trim() === '') {
        alert('비밀번호를 입력해주세요.');
        return;
      }

      const requestBody = { password: deletePassword };
      
      const response = await fetch('https://recode-my-life.site/api/user/', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        // 로컬 스토리지 정리
  localStorage.removeItem('role');
        localStorage.removeItem('name');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('phone');
        localStorage.removeItem('birthDate');
        
        // 성공 모달 표시
        setShowWithdrawalSuccess(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        
        // 상태 코드별 에러 메시지 처리 (백엔드 API 스펙에 맞춤)
        let errorMessage = '회원 탈퇴에 실패했습니다.';
        if (response.status === 401) {
          errorMessage = '입력하신 비밀번호가 올바르지 않습니다. 다시 확인해주세요.';
        } else if (response.status === 404) {
          errorMessage = '사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.';
        } else if (response.status === 400) {
          errorMessage = '잘못된 요청입니다. 비밀번호를 확인해주세요.';
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error during account withdrawal:', error);
      alert('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
    }
  };



  const handleToggleKeyboard = () => {
    setIsKeyboardVisible((prev) => !prev);
  };

  const handleWithdrawalSuccessClose = () => {
    setShowWithdrawalSuccess(false);
    router.replace('/'); // 홈으로 이동
  };

  const focusActiveInput = () => {
    setTimeout(() => {
      const inputRef =
        activeInput === 'currentPassword'
          ? currentPasswordRef
          : activeInput === 'newPassword'
          ? newPasswordRef
          : confirmPasswordRef;

      if (inputRef.current) {
        const inputElement = inputRef.current;
        inputElement.focus();
        const valueLength = inputElement.value.length;
        inputElement.setSelectionRange(valueLength, valueLength);
      }
    }, 0);
  };

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
    setIsKeyboardVisible(false);
  };

  return (
    <div className="bg-white">
      {/* Main Content only, header/navbar 제거됨 */}
      <main className="max-w-6xl mx-auto p-8">
        {/* Profile Information Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="text-green-600" size={24} />
            <h1 className="text-2xl font-bold text-gray-800">프로필 정보</h1>
          </div>
          <p className="text-gray-600 mb-6">기본 정보를 확인하고 수정할 수 있습니다</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Picture Section */}
          <div className="lg:col-span-1">
            <div className="relative">
              <div className="w-48 h-48 bg-gray-300 rounded-full mx-auto flex items-center justify-center relative">
                <Camera className="text-gray-500" size={48} />
                <button className="absolute bottom-2 right-2 w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center hover:bg-orange-600">
                  <Camera className="text-white" size={20} />
                </button>
              </div>
              <p className="text-center text-gray-600 mt-2">프로필 사진 (선택사항)</p>
            </div>
          </div>

          {/* User Details Section */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이름 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                  <p className="text-sm text-gray-500 mt-1">이름은 수정할 수 없습니다</p>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    휴대전화 번호 *
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    placeholder="'-' 없이 입력해주세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    현재 비밀번호
                  </label>
                  <div className="relative">
                    <input
                      ref={currentPasswordRef}
                      type="password"
                      placeholder="현재 비밀번호를 입력하세요"
                      value={formData.currentPassword}
                      onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                      onFocus={() => setActiveInput('currentPassword')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />  
                  </div>
                  <p className="text-sm text-gray-500 mt-1">비밀번호 변경 시에만 입력</p>
                </div>
            </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이메일 *
                  </label>
                  <input
                    type="text"
                    value={formData.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                  <p className="text-sm text-gray-500 mt-1">이메일은 수정할 수 없습니다</p>
                </div>
                {/* Birth Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    생년월일 *
                  </label>
                  <input
                    type="text"
                    value={formData.birthDate}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    새 비밀번호
                  </label>
                  <div className="relative">
                    <input
                      ref={newPasswordRef}
                      type="password"
                      placeholder="새 비밀번호를 입력하세요 (8자 이상)"
                      value={formData.newPassword}
                      onChange={(e) => handleInputChange('newPassword', e.target.value)}
                      onFocus={() => setActiveInput('newPassword')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">8자 이상의 비밀번호</p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    비밀번호 확인
                  </label>
                  <div className="relative">
                    <input
                      ref={confirmPasswordRef}
                      type="password"
                      placeholder="비밀번호를 다시 입력하세요"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      onFocus={() => setActiveInput('confirmPassword')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />  
                  </div>
                </div>


            

              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-12">
          <AccountDeletionModal onConfirm={handleConfirmWithdrawal}>
            <button className="w-full sm:w-auto px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600">
              회원탈퇴
            </button>
          </AccountDeletionModal>
          
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <button
                      type="button"
                      onClick={handleToggleKeyboard}
                    >
                      <Image
                        src="/icons/keyboard_icon.png"
                        alt="가상 키보드 열기/닫기"
                        width={24}
                        height={24}
                      />
                    </button>
            <button
              onClick={() => {
                // 계정 타입: 0=노인, 1=보호자
                const role = localStorage.getItem('role');
                if (role === 'ELDER') {
                  window.location.href = "/userinfo/link-elder";
                } else if (role === 'GUARDIAN') {
                  window.location.href = "/userinfo/link-guardian";
                } else {
                  alert('계정 타입을 확인할 수 없습니다.');
                }
              }}
              className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              보호자 연동 관리
            </button>
            
            <button
              onClick={handleSaveProfile}
              className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              프로필 저장
            </button>
            
          </div>
        </div>
      </main>

      {/* floating bar 제거됨 */}
      <VirtualKeyboard
        isVisible={isKeyboardVisible}
        onToggle={handleToggleKeyboard}
        onKeyPress={handleVirtualKeyPress}
        onBackspace={handleVirtualBackspace}
        onSpace={handleVirtualSpace}
        onEnter={handleVirtualEnter}
        currentInputValue={activeInput ? formData[activeInput] : ''}
      />

      {/* 회원탈퇴 성공 모달 */}
      <WithdrawalSuccessModal
        isOpen={showWithdrawalSuccess}
        onClose={handleWithdrawalSuccessClose}
      />
    </div>
  );
}
