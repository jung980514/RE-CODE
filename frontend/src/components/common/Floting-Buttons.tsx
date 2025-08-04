"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SearchIcon as SearchPlus, MousePointer2, Keyboard, ZoomIn, ZoomOut } from "lucide-react"

export function FloatingButtons() {
  const [isZoomed, setIsZoomed] = useState(false)
  const [isCustomCursor, setIsCustomCursor] = useState(false)

  const handleZoomToggle = () => {
    if (isZoomed) {
      document.body.style.zoom = '100%'
      setIsZoomed(false)
    } else {
      document.body.style.zoom = '125%'
      setIsZoomed(true)
    }
  }

  const handleCursorToggle = () => {
    // 'large-cursor' 클래스를 body에 토글하고, 그 상태를 isCustomCursor 상태와 동기화합니다.
    const isNowActive = document.body.classList.toggle('large-cursor');
    setIsCustomCursor(isNowActive);
  }

  return (
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
      
      {/* <Button
        variant="outline"
        size="icon"
        className="rounded-full w-12 h-12 shadow-md bg-white hover:bg-gray-50"
        aria-label="Keyboard"
      >
        <Keyboard className="h-6 w-6" />
      </Button> */}
    </div>
  )
}
