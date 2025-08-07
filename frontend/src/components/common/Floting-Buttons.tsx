"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { SearchIcon as SearchPlus, MousePointer2, BadgeQuestionMark, ZoomIn, ZoomOut } from "lucide-react"
import HelpDialog from "./help-dialog"

// 프로그램 데이터 정의
const programs = [
  {
    id: "basic-questions",
    title: "기억 꺼내기",
    subtitle: "기초질문",
    description: "일상적인 질문으로 자연스럽게 시작해보세요",
    icon: "Brain",
    image: "/images/기초질문배경.jpg",
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    duration: "10분",
    level: "기초",
    category: "기초질문"
  },
  {
    id: "personalized-questions",
    title: "이야기 나누기",
    subtitle: "개인화질문",
    description: "개인의 경험과 이야기를 자유롭게 나누어보세요",
    icon: "Heart",
    image: "/images/개인화질문배경.png",
    color: "from-orange-500 to-orange-600",
    bgColor: "bg-orange-50",
    duration: "10분",
    level: "중급",
    category: "개인화질문"
  },
  {
    id: "cognitive-stimulation",
    title: "들려오는 추억",
    subtitle: "인지자극질문",
    description: "음악과 소리로 감각을 자극하며 기억을 되살려보세요",
    icon: "Music",
    image: "/images/인지자극질문음악배경.png",
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50",
    duration: "10분",
    level: "고급",
    category: "인지자극질문"
  },
  {
    id: "era-questions",
    title: "추억의 시대",
    subtitle: "인지자극질문",
    description: "그 시절 사회 모습을 통해 시대적 추억을 공유해보세요",
    icon: "Camera",
    image: "/images/인지자극질문사진배경.jpg",
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
    duration: "10분",
    level: "고급",
    category: "인지자극질문"
  }
]

export function FloatingButtons() {
  const [isZoomed, setIsZoomed] = useState(false)
  const [isCustomCursor, setIsCustomCursor] = useState(false)
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false)

  // 모달이 열릴 때 body에 overflow: hidden 적용하고 스크롤바 너비 보상
  useEffect(() => {
    if (isHelpDialogOpen) {
      // 현재 스크롤 위치 저장
      const scrollY = window.scrollY
      
      // body에 overflow: hidden 적용
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      
      // 스크롤바 너비만큼 패딩 추가
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
    } else {
      // 원래 스크롤 위치 복원
      const scrollY = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
      
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1)
      }
    }

    // 컴포넌트 언마운트 시 스타일 초기화
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [isHelpDialogOpen])

  const handleZoomToggle = () => {
    if (isZoomed) {
      document.body.style.zoom = '100%'
      setIsZoomed(false)
    } else {
      document.body.style.zoom = '130%'
      setIsZoomed(true)
    }
  }

  const handleCursorToggle = () => {
    // 'large-cursor' 클래스를 body에 토글하고, 그 상태를 isCustomCursor 상태와 동기화합니다.
    const isNowActive = document.body.classList.toggle('large-cursor');
    setIsCustomCursor(isNowActive);
  }

  const handleHelpClick = () => {
    setIsHelpDialogOpen(true)
  }

  return (
    <>
      <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-12 h-12 shadow-md bg-white hover:bg-gray-50"
          aria-label={isZoomed ? "Zoom Out" : "Zoom In"}
          onClick={handleZoomToggle}
        >
          {isZoomed ? (
            <ZoomOut className="h-6 w-6" />
          ) : (
            <ZoomIn className="h-6 w-6" />
          )}
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className={`rounded-full w-12 h-12 shadow-md hover:bg-gray-50 ${
            isCustomCursor ? 'bg-blue-100 border-blue-300' : 'bg-white'
          }`}
          aria-label={isCustomCursor ? "Reset Cursor" : "Change Cursor"}
          onClick={handleCursorToggle}
        >
          <MousePointer2 className="h-6 w-6" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-12 h-12 shadow-md bg-white hover:bg-gray-50"
          aria-label="Help"
          onClick={handleHelpClick}
        >
          <BadgeQuestionMark className="h-6 w-6" />
        </Button>
      </div>
      
      <HelpDialog
        isOpen={isHelpDialogOpen}
        onOpenChange={setIsHelpDialogOpen}
        programs={programs}
      />
    </>
  )
}
