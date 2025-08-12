"use client"

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

interface AccountDeletionModalProps {
  children: React.ReactNode;
  onConfirm: (password: string) => Promise<void>;
}

/**
 * 회원 탈퇴 확인 모달 컴포넌트
 * 사용자가 계정 탈퇴를 시도할 때 경고 메시지와 함께 최종 확인을 요청합니다.
 */
export function AccountDeletionModal({ children, onConfirm }: AccountDeletionModalProps) {
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  // 모달이 닫힐 때 필드 초기화
  const handleOpenChange = (open: boolean) => {
    if (!isProcessing) { // 처리 중이 아닐 때만 모달 닫기 허용
      setIsOpen(open);
      if (!open) {
        setPassword("");
        setError("");
      }
    }
  };

  const handleDelete = async () => {
    if (!password || password.trim() === '') {
      setError("비밀번호를 입력해주세요.");
      return;
    }
    
    if (password.trim().length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    
    setError("");
    setIsProcessing(true);
    
    try {
      // 비밀번호를 직접 전달
      await onConfirm(password.trim());
      // 성공 시 모달 닫기
      setIsOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "회원 탈퇴 중 오류가 발생했습니다.";
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>회원 탈퇴 확인</DialogTitle>
          <DialogDescription>정말로 RE:CODE를 떠나시겠습니까?</DialogDescription>
        </DialogHeader>
        <div className="py-4 text-sm text-gray-500 dark:text-gray-400">
          <p>탈퇴하시면 다음 내용들이 모두 사라집니다:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>소중한 추억과 회상 기록들</li>
            <li>가족과 함께한 활동 내역</li>
            <li>개인 맞춤 설정 및 선호도</li>
            <li>치료 진행 상황 및 성과 기록</li>
            <li>저장해두신 사진과 메모들</li>
          </ul>
          <p className="mt-4 font-semibold">이 모든 기록들은 복구할 수 없습니다.</p>
          <p className="mt-4">
            혹시 일시적인 휴식이 필요하시다면, 대신 알림을 끄거나 앱 사용을 잠시 멈춰보시는 것은 어떨까요?
          </p>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호 입력</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleDelete();
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="비밀번호를 입력하세요"
            autoFocus
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <button 
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              취소
            </button>
          </DialogClose>
          <button 
            onClick={handleDelete}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? '처리 중...' : '회원탈퇴'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
