"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import { useCallback } from "react"

export interface TrainingCompleteModalProps {
  open: boolean
  onClose: () => void
  onPrimaryAction?: () => void
  title?: string
  description?: string
  primaryActionLabel?: string
}

export default function TrainingCompleteModal({
  open,
  onClose,
  onPrimaryAction,
  title = "훈련이 완료되었습니다",
  description = "수고하셨어요! 메인 페이지로 이동합니다.",
  primaryActionLabel = "확인",
}: TrainingCompleteModalProps) {
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) onClose()
    },
    [onClose]
  )

  const handlePrimary = useCallback(() => {
    if (onPrimaryAction) onPrimaryAction()
    onClose()
  }, [onPrimaryAction, onClose])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-8">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <DialogTitle className="text-2xl font-extrabold text-gray-900">{title}</DialogTitle>
          <DialogDescription className="text-base text-gray-700">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button onClick={handlePrimary} className="h-11 px-6 text-base bg-green-600 hover:bg-green-700 text-white">
            {primaryActionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


