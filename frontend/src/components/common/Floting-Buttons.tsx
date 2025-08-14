"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MousePointer2, ZoomIn, ZoomOut } from "lucide-react"



export function FloatingButtons() {
  const [isZoomed, setIsZoomed] = useState(false)
  const [isCustomCursor, setIsCustomCursor] = useState(false)

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
          <ZoomOut className="h-10 w-10" />
        ) : (
          <ZoomIn className="h-10 w-10" />
        )}
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        className={`rounded-full w-20 h-20 shadow-lg hover:bg-gray-50 border-2 ${
          isCustomCursor ? 'bg-blue-100 border-blue-300' : 'bg-white'
        }`}
        aria-label={isCustomCursor ? "Reset Cursor" : "Change Cursor"}
        onClick={handleCursorToggle}
      >
        <MousePointer2 className="h-10 w-10" />
      </Button>
    </div>
  )
}
