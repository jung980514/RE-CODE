"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MousePointer2, ZoomIn, ZoomOut } from "lucide-react"



export function FloatingButtons() {
  const [isZoomed, setIsZoomed] = useState(false)
  const [isCustomCursor, setIsCustomCursor] = useState(true)

  // 컴포넌트 마운트 시 기본적으로 큰 커서 활성화
  useEffect(() => {
    document.body.classList.add('large-cursor')
  }, [])

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

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-50">
      <Button
        variant="outline"
        size="icon"
        className="rounded-full w-20 h-20 shadow-lg bg-white hover:bg-gray-50 border-2"
        aria-label={isZoomed ? "Zoom Out" : "Zoom In"}
        onClick={handleZoomToggle}
      >
        {isZoomed ? (
          <ZoomOut className="!h-8 !w-8" style={{ width: '64px', height: '64px' }} />
        ) : (
          <ZoomIn className="!h-8 !w-8" style={{ width: '64px', height: '64px' }} />
        )}
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        className={`rounded-full w-20 h-20 shadow-lg hover:bg-gray-50 border-2 ${
          isCustomCursor ? 'bg-blue-100 border-blue-300' : 'bg-white'
        }`}
        aria-label={isCustomCursor ? "기본 커서로 변경" : "큰 커서로 변경"}
        onClick={handleCursorToggle}
      >
        <MousePointer2 className="!h-8 !w-8" style={{ width: '64px', height: '64px' }} />
      </Button>
    </div>
  )
}
