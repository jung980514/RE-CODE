"use client"

import { useState, useEffect, useRef } from "react"
import { Volume1, VolumeX, Volume2 } from "lucide-react"

interface WebcamViewProps {
  userName?: string
  volume?: number
  onVolumeChange?: (volume: number) => void
  isRecording?: boolean
}

export function WebcamView({ 
  userName = "김싸피", 
  volume = 80, 
  onVolumeChange,
  isRecording = false 
}: WebcamViewProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isWebcamActive, setIsWebcamActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        }, 
        audio: false 
      })
      setStream(mediaStream)
      setIsWebcamActive(true)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error("웹캠 접근 오류:", error)
    }
  }

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
      setIsWebcamActive(false)
    }
  }

  useEffect(() => {
    startWebcam()
    return () => {
      stopWebcam()
    }
  }, [])

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value)
    onVolumeChange?.(newVolume)
  }

  return (
    <div className="text-center">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">나 ({userName})</h3>

      {/* 웹캠 화면 */}
      <div className="relative bg-gray-900 aspect-video rounded-xl overflow-hidden mb-6">
        {isWebcamActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📹</span>
              </div>
              <p className="text-sm">카메라를 불러오는 중...</p>
            </div>
          </div>
        )}

        {/* 녹음 상태 표시 */}
        {isRecording && (
          <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            녹음 중...
          </div>
        )}
      </div>

      {/* 음량 조절 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume1 className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">음량</span>
          </div>
          <span className="text-sm text-gray-500">{volume}%</span>
        </div>
        <div className="flex items-center gap-3">
          <VolumeX className="w-4 h-4 text-gray-400" />
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
            className="flex-1 h-2 bg-gray-200 rounded-full appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume}%, #e5e7eb ${volume}%, #e5e7eb 100%)`
            }}
          />
          <Volume2 className="w-4 h-4 text-gray-600" />
        </div>
      </div>
    </div>
  )
} 