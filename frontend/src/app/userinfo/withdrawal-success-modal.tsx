"use client"

import React from "react"
import { Heart, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface WithdrawalSuccessModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * 회원 탈퇴 완료 모달 컴포넌트
 * 사용자에게 감사 인사와 함께 따뜻한 작별 메시지를 전달합니다.
 */
export function WithdrawalSuccessModal({ isOpen, onClose }: WithdrawalSuccessModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            회원 탈퇴가 완료되었습니다
          </DialogTitle>
          <DialogDescription className="text-base text-gray-600 space-y-3">
            <p>그동안 RE:CODE와 함께해주셔서 진심으로 감사드립니다.</p>
            <div className="flex items-center justify-center space-x-1">
              <Heart className="w-4 h-4 text-red-400 fill-current" />
              <span className="text-sm">소중한 추억들을 만들어주셔서 고마웠습니다</span>
              <Heart className="w-4 h-4 text-red-400 fill-current" />
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 space-y-4 text-sm text-gray-500">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="text-blue-800 font-medium mb-2">언제든 다시 돌아오세요</p>
            <p className="text-blue-700">
              새로운 마음으로 다시 시작하고 싶으시다면, 
              언제든 새 계정으로 가입하실 수 있습니다.
            </p>
          </div>
          
          <div className="space-y-2">
            <p className="font-medium text-gray-700">건강하고 행복한 나날 되시길 바랍니다</p>
            <p className="text-xs text-gray-400">
              소중한 시간을 함께해주셔서 정말 감사했습니다.
            </p>
          </div>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button 
            onClick={onClose}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8"
          >
            홈으로 돌아가기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
