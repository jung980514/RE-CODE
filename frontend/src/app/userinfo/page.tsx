"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Users } from 'lucide-react';
import Image from 'next/image';
import { AccountDeletionModal } from './account-deletion-modal';

export default function UserInfoPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    birthDate: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    email: '',
  });

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('http://localhost:8088/api/user/', {
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
    fetchUserInfo();
  }, [router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = () => {
    // 프로필 저장 로직
    console.log('프로필 저장:', formData);
    alert('프로필이 저장되었습니다.');
  };

  const handleGuardianLink = () => {
    // 보호자 연동 관리 로직
    console.log('보호자 연동 관리');
    alert('보호자 연동 관리 기능입니다.');
  };

  const handleConfirmWithdrawal = async () => {
    try {
      const response = await fetch('http://localhost:8088/api/user/', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        alert('회원 탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.');
        // 로컬 스토리지 정리
        localStorage.removeItem('userType');
        localStorage.removeItem('name');
        // 다른 정보도 필요 시 삭제
        router.replace('/'); // 메인 페이지로 리디렉션
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`회원 탈퇴에 실패했습니다: ${errorData.message || '서버 오류가 발생했습니다.'}`);
      }
    } catch (error) {
      console.error('Error during account withdrawal:', error);
      alert('회원 탈퇴 중 오류가 발생했습니다.');
    }
  };

  const handlePhoneChange = () => {
    // 휴대전화 번호 변경 로직
    alert('휴대전화 번호 변경 기능입니다.');
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
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={formData.phoneNumber}
                      disabled
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                    <button
                      onClick={handlePhoneChange}
                      className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                    >
                      변경하기
                    </button>
                  </div>
                </div>
                
                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    비밀번호 확인
                  </label>
                  <input
                    type="password"
                    placeholder="비밀번호를 다시 입력하세요"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
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
                  <input
                    type="password"
                    placeholder="새 비밀번호를 입력하세요"
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
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
              onClick={() => {
                // 계정 타입: 0=노인, 1=보호자
                const userType = localStorage.getItem('userType');
                if (userType === '0') {
                  window.location.href = "/userinfo/link-elder";
                } else if (userType === '1') {
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
    </div>
  );
}
