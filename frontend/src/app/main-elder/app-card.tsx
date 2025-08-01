import type React from "react"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"

interface AppCardProps {
  Icon: LucideIcon
  title: string
  description: string
  onClick: () => void
}

export const AppCard: React.FC<AppCardProps> = ({ Icon, title, description, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="bg-[#1c1c1e] rounded-2xl p-6 shadow-lg cursor-pointer w-56"
      onClick={onClick}
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-[#2c2c2e] flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
        <p className="text-[#8e8e93] text-sm">{description}</p>
      </div>
    </motion.div>
  )
}