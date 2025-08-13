"use client"

import { motion, AnimatePresence } from "framer-motion"
import { SurveyCompleteModalProps } from "./types"
import { Check } from "lucide-react"
import { useRouter } from "next/navigation"

const modalVariants = {
  hidden: { 
    opacity: 0,
    scale: 0.8,
    y: 20
  },
  visible: { 
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 20,
    transition: {
      duration: 0.2
    }
  }
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
}

export default function SurveyCompleteModal({ isOpen, onConfirm }: SurveyCompleteModalProps) {
  const router = useRouter()

  const handleConfirm = () => {
    try {
      // 응답은 기다리지 않고 바로 네비게이션 (fire-and-forget)
      void fetch('https://recode-my-life.site/api/survey/generate/personal', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      }).catch((e) => console.error('개인화 생성 요청 실패:', e))
      // 로컬스토리지 완료 플래그 저장
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('isdailysurveycompleted', '1')
        }
      } catch {}
    } catch (e) {
      // 네트워크 예외는 무시하고 진행
      console.error('개인화 생성 요청 예외:', e)
    } finally {
      // 바로 회상 훈련으로 이동
      router.push('/main-elder/recall-training')
      // 기존 콜백도 호출 (선택적 후처리용)
      try { onConfirm(); } catch {}
    }
  }
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black bg-opacity-50" />
          
          {/* Modal */}
          <motion.div
            className="relative bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-semibold text-gray-900 text-center mb-3">
              일일 설문이 완료되었습니다
            </h2>

            {/* Subtitle */}
            <p className="text-gray-600 text-center mb-8">
              회상 훈련 화면으로 이동합니다
            </p>

            {/* Confirm Button */}
            <button
              onClick={handleConfirm}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg"
            >
              확인
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
