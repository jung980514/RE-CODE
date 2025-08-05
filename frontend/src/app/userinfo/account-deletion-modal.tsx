"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface AccountDeletionModalProps {
  /**
   * 모달을 트리거할 요소 (예: 버튼)
   */
  children: React.ReactNode
  /**
   * 사용자가 탈퇴를 최종 확인했을 때 호출될 콜백 함수
   */
  onConfirm: () => void
}

/**
 * 회원 탈퇴 확인 모달 컴포넌트
 * 사용자가 계정 탈퇴를 시도할 때 경고 메시지와 함께 최종 확인을 요청합니다.
 */
export function AccountDeletionModal({ children, onConfirm }: AccountDeletionModalProps) {
  return (
    <Dialog>
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
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              취소
            </Button>
          </DialogClose>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            탈퇴
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
