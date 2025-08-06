"use client"

import { useState, useEffect, useRef } from "react"
import { Camera } from 'lucide-react';
interface WebcamViewProps {
  userName?: string
  isRecording?: boolean
  onStreamReady?: (stream: MediaStream) => void
  videoRef?: React.RefObject<HTMLVideoElement | null>
}
const username2 = localStorage.getItem('name')
export function WebcamView({ 
  userName = username2 || "김싸피", 
  isRecording = false, 
  onStreamReady,
  videoRef: externalVideoRef
}: WebcamViewProps) {
  const [isWebcamActive, setIsWebcamActive] = useState(false)
  const internalVideoRef = useRef<HTMLVideoElement>(null)
  const finalVideoRef = externalVideoRef || internalVideoRef

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
      if (onStreamReady) {
        onStreamReady(mediaStream)
      }
      setIsWebcamActive(true)
      
      if (finalVideoRef.current) {
        finalVideoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error("웹캠 접근 오류:", error)
    }
  }

  const stopWebcam = (stream: MediaStream | null) => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    setIsWebcamActive(false)
  }

  useEffect(() => {
    let stream: MediaStream | null = null
    const init = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user"
          }, 
          audio: false 
        })
        if (onStreamReady) {
          onStreamReady(stream)
        }
        setIsWebcamActive(true)
        
        if (finalVideoRef.current) {
          finalVideoRef.current.srcObject = stream
        }
      } catch (error) {
        console.error("웹캠 접근 오류:", error)
      }
    }
    init()
    return () => {
      stopWebcam(stream)
    }
  }, [onStreamReady])

  return (
    <div className="text-center">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">내 화면({userName})</h3>

      {/* 웹캠 화면 */}
      <div className="relative bg-gray-900 aspect-square rounded-xl overflow-hidden mb-6">
        {isWebcamActive ? (
          <video
            ref={finalVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl"><Camera /></span>
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


    </div>
  )
} 