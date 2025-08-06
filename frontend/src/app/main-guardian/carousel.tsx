"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { AppCard } from "./carousel-card"

const noScrollbarCSS = `
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`

interface CarouselProps {
  items: Array<{
    Icon: React.ElementType
    title: string
    description: string
    action: () => void
  }>
}

export const Carousel: React.FC<CarouselProps> = ({ items }) => {
  const carouselRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const updateScrollButtons = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    const carousel = carouselRef.current
    if (carousel) {
      carousel.addEventListener("scroll", updateScrollButtons)
      // Initial check
      updateScrollButtons()
      return () => carousel.removeEventListener("scroll", updateScrollButtons)
    }
  }, [carouselRef.current])

  const scroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const { scrollLeft, clientWidth } = carouselRef.current
      // Scroll by the width of one card plus its margin
      const cardWidth = 320 // w-80 = 320px
      const cardMargin = 24 // space-x-6 = 24px
      const scrollAmount = cardWidth + cardMargin

      const scrollTo = direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount

      carouselRef.current.scrollTo({ left: scrollTo, behavior: "smooth" })
    }
  }

  return (
    <>
      <style>{noScrollbarCSS}</style>
      <div className="relative w-full max-w-[1380px] p-8 rounded-3xl bg-white/30 backdrop-blur-xl">
        <motion.div
          ref={carouselRef}
          className="flex space-x-6 overflow-x-auto scrollbar-hide py-4 no-scrollbar"
          style={{ scrollSnapType: "x mandatory", msOverflowStyle: "none", scrollbarWidth: "none" }}
        >
          {items.map((item, index) => (
            <motion.div key={index} className="flex-shrink-0" style={{ scrollSnapAlign: "start" }}>
              <AppCard Icon={item.Icon} title={item.title} description={item.description} onClick={item.action} />
            </motion.div>
          ))}
        </motion.div>
        <AnimatePresence>
          {canScrollLeft && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => scroll("left")}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-md rounded-full p-2 shadow-lg transition-colors hover:bg-white"
            >
              <ChevronLeft className="w-6 h-6 text-gray-800" />
            </motion.button>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {canScrollRight && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => scroll("right")}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-md rounded-full p-2 shadow-lg transition-colors hover:bg-white"
            >
              <ChevronRight className="w-6 h-6 text-gray-800" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
