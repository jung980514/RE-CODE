"use client"
import { motion, Variants } from "framer-motion"
import { ToastProvider, useToast } from "./toast-context"
import { ToastContainer } from "./animated-toast"
import { Carousel } from "./carousel"
import { NotebookPen, ContactRound, CalendarDays, Moon} from "lucide-react"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 },
  },
}

const FlowersAndSaintsUI = () => {
  const { addToast } = useToast()

  const items = [
    {
      Icon: NotebookPen,
      title: "기록하기",
      description: "소중한 이야기를 기록하며 추억을 떠올리고, 나만의 회상 캘린더를 만들어보세요.",
      action: () => addToast("Roses symbolize love and passion", "flower"),
    },
    {
      Icon: ContactRound,
      title: "회원정보",
      description: "소중한 개인정보와 보호자 정보를 안전하게 보호하며 관리합니다",
      action: () => addToast("St. Francis is known for his love of nature", "saint"),
    },
    {
      Icon: CalendarDays,
      title: "회상캘린더",
      description: "우리가 함께 나눈 이야기와 되살린 기억들이 담긴 감성적인 달력입니다.",
      action: () => addToast("Sunflowers always face the sun", "flower"),
    },
    {
      Icon: Moon,
      title: "로그아웃",
      description: "우리의 기록과 개인정보를 안전하게 보호하기 위해 사용 후 로그아웃해주세요.",
      action: () => addToast("St. Clare is the patron saint of television", "saint"),
    },
  ]

  return (
    <motion.div
      className="flex flex-col items-center justify-center h-217 overflow-hidden bg-gradient-to-br from-emerald-100 to-violet-100 p-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1
        className="text-4xl font-bold text-black-800 mb-8"
        style={{ fontFamily: "Paperlogy, sans-serif" }}
        variants={itemVariants}
      >
        안녕하세요! USERNAME님!
      </motion.h1>
      <motion.h1
        className="text-4xl font-bold text-black-800 mb-8"
        style={{ fontFamily: "Paperlogy, sans-serif" }}
        variants={itemVariants}
      >
        오늘도 웃음꽃 피는 하루 보내세요!!
      </motion.h1>
      <motion.div variants={itemVariants} className="w-full flex justify-center">
        <Carousel items={items} />
      </motion.div>
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
