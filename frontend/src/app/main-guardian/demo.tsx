"use client"
import { motion } from "framer-motion"
import { useState } from "react"
import { ToastProvider, useToast } from "@/app/main-elder/toast-context"
import { ToastContainer } from "@/app/main-elder/animated-toast"
import { Carousel } from "@/app/main-guardian/carousel"
import { HelpCircle, ContactRound, CalendarDays,} from "lucide-react"
import { useRouter } from 'next/navigation'
import HelpModal from "@/app/main-elder/recall-training/components/help-modal"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 },
  },
}

const FlowersAndSaintsUI = () => {
  const { addToast } = useToast()
  const router = useRouter()
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false)
  
  const items = [
    {
      Icon: ContactRound,
      title: "회원정보",
      description: "소중한 개인정보와 보호자 정보를 안전하게 보호하며 관리합니다",
      action: () => router.push('/userinfo'),
    },
    {
      Icon: CalendarDays,
      title: "회상캘린더",
      description: "우리가 함께 나눈 이야기와 되살린 기억들이 담긴 감성적인 달력입니다.",
      action: () => router.push('/calender'),
    },
    {
      Icon: HelpCircle,
      title: "도움말",
      description: "서비스를 활용하는 방법을 알려드립니다.",
      action: () => setIsHelpDialogOpen(true),
    },
  ]

  return (
    <motion.div
      className="flex flex-col items-center justify-center h-207 overflow-hidden bg-gradient-to-br from-violet-100 to-emerald-100 p-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1
        className="text-4xl font-bold text-black-800 mb-8"
        style={{ fontFamily: "Paperlogy, sans-serif" }}

      >
        열람하지 않은 회상기록이 있습니다!
      </motion.h1>
      <motion.h1
        className="text-4xl font-bold text-black-800 mb-8"
        style={{ fontFamily: "Paperlogy, sans-serif" }}
      >
        회상캘린더에서 확인하세요!
      </motion.h1>
      <motion.div className="flex justify-center">
        <Carousel items={items} />
      </motion.div>
      
      {/* 도움말 모달 */}
      <HelpModal
        open={isHelpDialogOpen}
        onOpenChange={setIsHelpDialogOpen}
      />
      
      <ToastContainer />
    </motion.div>
  )
}

export default function Demo() {
  return (
    <ToastProvider>
      <FlowersAndSaintsUI />
    </ToastProvider>
  )
}
