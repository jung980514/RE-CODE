"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Users, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { AccountDeletionModal } from './account-deletion-modal';
import { WithdrawalSuccessModal } from './withdrawal-success-modal';
import { ProfileSaveSuccessModal } from './profile-save-success-modal';
import { VirtualKeyboard } from '@/components/common/VirtualKeyboard';
import { AlertModal } from '@/components/ui/modal';

export default function UserInfoPage() {
  const router = useRouter();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [activeInput, setActiveInput] = useState<'currentPassword' | 'newPassword' | 'confirmPassword' | null>(null);
  const currentPasswordRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  
  // 비밀번호 가시성 상태
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    birthDate: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    email: '',
    profileImageUrl: '',
  });

  // 원본 사용자 정보를 저장 (변경 감지용)
  const [originalUserInfo, setOriginalUserInfo] = useState({
    name: '',
    phone: '',
    birthDate: '',
    email: '',
    profileImageUrl: '',
  });

  // 프로필 이미지 관련 상태
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 모달 상태
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({
    isOpen: false,
    message: '',
    type: 'info'
  });

  const [showWithdrawalSuccess, setShowWithdrawalSuccess] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // const response = await fetch('http://localhost:8088/api/user/', {
        const response = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL +'/api/user/', {
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
              email: result.data.email || '',
              profileImageUrl: result.data.profileImageUrl || '',
            }));
            
            // 원본 사용자 정보 저장
            setOriginalUserInfo({
              name: result.data.name || '',
              phone: result.data.phone || '',
              birthDate: result.data.birthDate || '',
              email: result.data.email || '',
              profileImageUrl: result.data.profileImageUrl || '',
            });
            
            // 기존 프로필 이미지가 있으면 미리보기 설정
            if (result.data.profileImageUrl) {
              setPreviewImage(result.data.profileImageUrl);
            }
          }
        } else {
          console.error('Failed to fetch user info');
          setAlertModal({
            isOpen: true,
            message: '사용자 정보를 불러오는데 실패했습니다. 다시 로그인해주세요.',
            type: 'error'
          });
          router.push('/');
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };
    
    fetchUserInfo();
  }, [router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 비밀번호 가시성 토글 함수
  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // 프로필 이미지 선택 처리
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    // const file = event.target.files?.[0];
    // if (file) {
    //   // 파일 크기 체크 (2MB 제한 - Base64로 변환 시 크기 증가를 고려)
    //   if (file.size > 2 * 1024 * 1024) {
    //     console.error('❌ 파일 크기 초과:', Math.round(file.size / 1024 / 1024), 'MB');
    //     return;
    //   }

    //   // 파일 타입 체크
    //   if (!file.type.startsWith('image/')) {
    //     console.error('❌ 이미지 파일이 아닙니다:', file.type);
    //     return;
    //   }

    //   setProfileImageFile(file);
      
    //   // 미리보기 생성
    //   const reader = new FileReader();
    //   reader.onload = (e) => {
    //     setPreviewImage(e.target?.result as string);
    //   };
    //   reader.readAsDataURL(file);
    // }

    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      console.error('❌ 파일 크기 초과(2MB)');
      return;
    }
    if (!file.type.startsWith('image/')) {
      console.error('❌ 이미지 파일이 아닙니다');
      return;
    }

    setProfileImageFile(file);

    // ✅ 미리보기는 Object URL만 사용 (Base64 금지)
    const objectUrl = URL.createObjectURL(file);
    setPreviewImage(objectUrl);
  };

  // 프로필 이미지 클릭 핸들러
  const handleProfileImageClick = () => {
    fileInputRef.current?.click();
  };

  // const handleSaveProfile = () => {
  //   // 프로필 저장 로직
  //   console.log('프로필 저장:', formData);
  //   alert('프로필이 저장되었습니다.');
  // };



  const handleSaveProfile = async () => {
    try {
      // 프로필 이미지 업로드 처리
      // let profileImageUrl = formData.profileImageUrl;
      // if (profileImageFile) {
      //   // TODO: 실제 파일 업로드를 위해서는 별도의 이미지 업로드 API 엔드포인트가 필요합니다.
      //   // 현재는 base64 데이터로 처리 (개발 목적)
      //   // 실제 운영환경에서는 multipart/form-data로 파일을 업로드하고 URL을 받아야 합니다.
        
      //   // Base64 이미지는 크기가 크므로 실제로는 파일 서버에 업로드 후 URL을 받아야 함
      //   if (previewImage && previewImage.startsWith('data:')) {
      //             // 파일 크기 제한 체크 (Base64는 원본보다 약 33% 크므로)
      //   if (previewImage.length > 500000) { // 약 375KB 원본 크기 제한
      //     console.error('❌ 이미지 파일이 너무 큽니다:', Math.round(previewImage.length / 1024), 'KB');
      //     return;
      //   }
      //   }
        
      //   profileImageUrl = previewImage || '';
      // }

      // 비밀번호 변경 여부 확인 (실제로 새 비밀번호를 입력했을 때만)
      const isChangingPassword = formData.newPassword && formData.newPassword.trim().length > 0;
      
      if (isChangingPassword) {
        // 현재 비밀번호 확인
        if (!formData.currentPassword || formData.currentPassword.trim() === '') {
          console.error('❌ 현재 비밀번호가 입력되지 않았습니다.');
          return;
        }

        // 새 비밀번호 길이 확인 (백엔드 규칙: 8~100자)
        if (formData.newPassword.trim().length < 8 || formData.newPassword.trim().length > 100) {
          console.error('❌ 비밀번호 길이 오류: 8~100자여야 합니다.');
          return;
        }

        // 비밀번호 확인 체크
        if (formData.newPassword.trim() !== formData.confirmPassword.trim()) {
          console.error('❌ 비밀번호 확인 불일치');
          return;
        }
      }

      // 변경된 값만 폼에 담기
      const fd = new FormData();

      // API 요청 데이터 구성
      const updateData: {
        name?: string;
        phone?: string;
        profileImageUrl?: string;
        currentPassword?: string;
        newPassword?: string;
      } = {};
      
      // 이름이 입력된 경우 (원본과 다른 경우에만)
      if (formData.name && formData.name.trim() !== '') {
        const trimmedName = formData.name.trim();
        if (trimmedName !== originalUserInfo.name && trimmedName.length >= 1 && trimmedName.length <= 100) {
          updateData.name = trimmedName;
          fd.append('name', trimmedName);
        }
      }

       // ✅ 프로필 이미지 파일(선택)
      if (profileImageFile) {
        // 파일명과 타입을 같이 넘기는 게 안전
        fd.append('profileImage', profileImageFile, profileImageFile.name);
      }

      // 프로필 이미지가 변경된 경우
      // if (profileImageUrl && profileImageUrl !== originalUserInfo.profileImageUrl) {
      //   // URL 길이 검증 (255자 제한)
      //   if (profileImageUrl.length <= 255) {
      //     updateData.profileImageUrl = profileImageUrl;
      //   } else {
      //     console.error('❌ 프로필 이미지 URL이 너무 깁니다:', profileImageUrl.length, '자');
      //     return;
      //   }
      // }

      // 전화번호가 입력된 경우 (기존 값과 다르거나 새로 입력된 경우)
      if (formData.phoneNumber && formData.phoneNumber.trim() !== '') {
        const phoneNumber = formData.phoneNumber.trim();
        
        // 전화번호 형식 검증 (백엔드 패턴과 일치: ^[0-9\\-]{9,20}$)
        const phoneRegex = /^[0-9\-]{9,20}$/;
        if (!phoneRegex.test(phoneNumber)) {
          console.error('❌ 전화번호 형식 오류:', phoneNumber);
          return;
        }
        
        // 원본 전화번호와 다른 경우에만 업데이트
        if (phoneNumber !== originalUserInfo.phone) {
          updateData.phone = phoneNumber;
          fd.append('phone', phoneNumber);
        }
      }

      // 비밀번호 변경이 요청된 경우 (실제로 비밀번호를 변경할 때만)
      if (isChangingPassword) {
        updateData.currentPassword = formData.currentPassword.trim();
        updateData.newPassword = formData.newPassword.trim();
        fd.append('newPassword', formData.newPassword.trim());
      }

              // 업데이트할 데이터가 있는지 확인
        // if (Object.keys(updateData).length === 0) {
        //   console.log('ℹ️ 변경된 정보가 없습니다.');
        //   return;
        // }

      // 디버깅: 전송할 데이터 로그
      console.log('전송할 데이터:', updateData);
      console.log('원본 사용자 정보:', originalUserInfo);
      console.log('fd:',fd);

      // API 호출
      const response = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL +'/api/user/update', {
        method: 'PATCH',
        // headers: {
        //   'Content-Type': 'application/json',
        // },
        credentials: 'include',
        // body: JSON.stringify(updateData),
        body: fd,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          console.log('✅ 프로필 저장 성공');
          
          // 비밀번호 변경이 성공한 경우 필드 초기화
          if (isChangingPassword) {
            setFormData(prev => ({
              ...prev,
              currentPassword: '',
              newPassword: '',
              confirmPassword: '',
            }));
          }
          
          // 프로필 이미지 업로드가 성공한 경우 상태 초기화
          if (profileImageFile) {
            setProfileImageFile(null);
            setFormData(prev => ({
              ...prev,
              profileImageUrl: result.data.profileImageUrl
            }));
          }
          
          // 성공 시 원본 정보 업데이트
          if (updateData.phone) {
            setOriginalUserInfo(prev => ({
              ...prev,
              phone: updateData.phone!
            }));
          }
          if (updateData.profileImageUrl) {
            setOriginalUserInfo(prev => ({
              ...prev,
              profileImageUrl: updateData.profileImageUrl!
            }));
          }
          
          // 성공 모달 표시
          setShowSaveSuccess(true);
        } else {
          console.error('❌ 프로필 저장 실패:', result.message || '알 수 없는 오류');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        
        // 에러 메시지 처리 (콘솔에만 출력)
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
        
        console.error('❌ 프로필 저장 오류:', errorMessage);
        console.error('상태 코드:', response.status);
        console.error('응답 데이터:', errorData);
      }
    } catch (error) {
      console.error('❌ 프로필 저장 중 예외 발생:', error);
    }
  };

  const handleConfirmWithdrawal = async (password: string) => {
    try {
      const requestBody = { password: password };
      // const response = await fetch('http://localhost:8088/api/user/', {
      const response = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL +'/api/user/', {
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
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error during account withdrawal:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
      }
    }
  };



  const handleToggleKeyboard = () => {
    setIsKeyboardVisible((prev) => !prev);
  };

  const handleWithdrawalSuccessClose = () => {
    setShowWithdrawalSuccess(false);
    router.replace('/'); // 홈으로 이동
  };

  const handleSaveSuccessClose = () => {
    setShowSaveSuccess(false);
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
                {previewImage ? (
                  <Image
                    src={previewImage}
                    alt="프로필 사진"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <Camera className="text-gray-500" size={48} />
                )}
                <button 
                  type="button"
                  onClick={handleProfileImageClick}
                  className="absolute bottom-2 right-2 w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center hover:bg-orange-600"
                >
                  <Camera className="text-white" size={20} />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
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
                      type={showPasswords.current ? "text" : "password"}
                      placeholder="현재 비밀번호를 입력하세요"
                      value={formData.currentPassword}
                      onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                      onFocus={() => setActiveInput('currentPassword')}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPasswords.current ? (
                        <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
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
                      type={showPasswords.new ? "text" : "password"}
                      placeholder="새 비밀번호를 입력하세요 (8자 이상)"
                      value={formData.newPassword}
                      onChange={(e) => handleInputChange('newPassword', e.target.value)}
                      onFocus={() => setActiveInput('newPassword')}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
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
                      type={showPasswords.confirm ? "text" : "password"}
                      placeholder="비밀번호를 다시 입력하세요"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      onFocus={() => setActiveInput('confirmPassword')}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
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
                  setAlertModal({
                    isOpen: true,
                    message: '계정 타입을 확인할 수 없습니다.',
                    type: 'error'
                  });
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

       {/* 프로필 저장 성공 모달 */}
       <ProfileSaveSuccessModal
         isOpen={showSaveSuccess}
         onClose={handleSaveSuccessClose}
       />

       {/* 모달들 */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
}
