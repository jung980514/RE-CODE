"use client"

import React from 'react';

interface ProfileSaveSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileSaveSuccessModal: React.FC<ProfileSaveSuccessModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <div className="text-center">
          {/* 성공 아이콘 */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg 
              className="h-8 w-8 text-green-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>
          
          {/* 제목 */}
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            저장 완료
          </h3>
          
          {/* 메시지 */}
          <p className="text-gray-600 mb-6">
            변경사항이 성공적으로 저장되었습니다.
          </p>
          
          {/* 확인 버튼 */}
          <button
            onClick={onClose}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
