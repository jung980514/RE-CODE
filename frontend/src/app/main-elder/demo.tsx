"use client"
import { motion } from "framer-motion"
import { ToastProvider, useToast } from "./toast-context"
import { ToastContainer } from "./animated-toast"
import { Carousel } from "./carousel"
import { NotebookPen, ContactRound, CalendarDays, Moon, Users} from "lucide-react"
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

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
  const username = localStorage.getItem('name')
  const isDailySurveyCompleted = localStorage.getItem('isdailysurveycompleted')
  
  const items = [
    {
      Icon: NotebookPen,
      title: "기록하기",
      description: "소중한 이야기를 기록하며 추억을 떠올리고, 나만의 회상 캘린더를 만들어보세요.",
      action: () => router.push('/main-elder/daily-survey'),
    },
    {
      Icon: ContactRound,
      title: "회원정보",
      description: "소중한 개인정보와 보호자 정보를 안전하게 보호하며 관리합니다",
      action: () => router.push('/userinfo'),
    },
    {
      Icon: Users,
      title: "보호자 연동관리",
      description: "보호자와의 연동을 관리하고, 연동 요청을 승인할 수 있습니다.",
      action: () => router.push('/userinfo/link-elder'),
    },
    {
      Icon: CalendarDays,
      title: "회상캘린더",
      description: "우리가 함께 나눈 이야기와 되살린 기억들이 담긴 감성적인 달력입니다.",
      action: () => router.push('/calender'),
    },
    {
      Icon: Moon,
      title: "로그아웃",
      description: "우리의 기록과 개인정보를 안전하게 보호하기 위해 사용 후 로그아웃해주세요.",
      action: () => {
        // 로그아웃 처리
        localStorage.clear()
        window.location.href = '/'
      },
    },
  ]

  return (
    <div className="relative">
      {/* 일일설문조사 미완료 시 귀여운 캐릭터 알림 */}
      {isDailySurveyCompleted === '0' && (
        <div className="fixed bottom-8 right-8 z-50">
          <div className="relative">
            {/* 말풍선 */}
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-300 p-4 mb-2 relative">
              <div className="text-center">
                <p className="text-base text-blue-700">
                  아직 일일설문조사가<br />
                  완료되지 않았어요 ʕ ·ᴥ·ʔ
                </p>
              </div>
              {/* 말풍선 꼬리 */}
              <div className="absolute bottom-0 right-6 transform translate-y-full">
                <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[15px] border-t-white"></div>
              </div>
            </div>
            
            {/* angry-fox 캐릭터 */}
            <div className="flex justify-center">
              <img 
                src="/images/angry-fox.gif" 
                alt="Angry Fox" 
                className="w-32 h-32 shadow-lg border-0 outline-none bg-transparent"
                style={{ 
                  border: 'none', 
                  outline: 'none',
                  backgroundColor: 'transparent',
                  boxShadow: 'none'
                }}
              />
            </div>
          </div>
        </div>
      )}

      <motion.div
        className="flex flex-col items-center justify-center h-207 overflow-hidden bg-gradient-to-br from-emerald-100 to-violet-100 p-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1
          className="text-4xl font-bold text-black-800 mb-8"
          style={{ fontFamily: "Paperlogy, sans-serif" }}
        >
          안녕하세요! {username}님!
        </motion.h1>
        <motion.h1
          className="text-4xl font-bold text-black-800 mb-8"
          style={{ fontFamily: "Paperlogy, sans-serif" }}
        >
          오늘도 웃음꽃 피는 하루 보내세요!!
        </motion.h1>
        <motion.div className="w-full flex justify-center">
          <Carousel items={items} />
        </motion.div>
        <ToastContainer />
      </motion.div>
    </div>
  )
}

export default function Demo() {
  return (
    <ToastProvider>
      <FlowersAndSaintsUI />
    </ToastProvider>
  )
}
