"use client"

import type React from "react"
import { motion } from "framer-motion"

interface AppCardProps {
  Icon: React.ElementType
  title: string
  description: string
  onClick: () => void
}

export const AppCard: React.FC<AppCardProps> = ({ Icon, title, description, onClick }) => {
  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
      whileTap={{ scale: 0.95 }}
      className="bg-white rounded-xl p-6 shadow-md cursor-pointer w-78 h-[480px] flex flex-col justify-between transition-colors duration-300 hover:bg-gray-50"
      onClick={onClick}
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-50 h-50 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
          <Icon className="w-30 h-30 text-indigo-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2"
            style={{ fontFamily: "Paperlogy, sans-serif" }}>{title}</h2>
        <p className="text-gray-600 text-xl">{description}</p>
      </div>
      <div className="mt-4 text-indigo-600 text-lg font-figtree font-medium">바로가기</div>
    </motion.div>
  )
}
