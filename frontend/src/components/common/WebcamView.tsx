"use client"

import { useState, useEffect, useRef } from "react"
import { Camera } from 'lucide-react';
interface WebcamViewProps {
  userName?: string
  isRecording?: boolean
  onStreamReady?: (stream: MediaStream) => void
  videoRef?: React.RefObject<HTMLVideoElement | null>
  // 외부에서 제공된 스트림을 미리보기로 사용 (제공 시 내부 getUserMedia를 호출하지 않음)
  stream?: MediaStream | null
}
const username2 = typeof window !== 'undefined' ? localStorage.getItem('name') : null
export function WebcamView({ 
  userName = username2 || "김싸피", 
  isRecording = false, 
  onStreamReady,
  videoRef: externalVideoRef,
  stream
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
    // 외부 스트림이 주어지면 그것을 사용
    if (stream && finalVideoRef.current) {
      finalVideoRef.current.srcObject = stream
      setIsWebcamActive(true)
      return () => {
        // 외부 스트림은 소유자가 관리하므로 이곳에서 중지하지 않음
        if (finalVideoRef.current) {
          finalVideoRef.current.srcObject = null
        }
      }
    }

    // 외부 스트림이 없을 때만 내부에서 비디오 전용 스트림 획득
    let localStream: MediaStream | null = null
    const init = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user"
          }, 
          audio: false 
        })
        if (onStreamReady) {
          onStreamReady(localStream)
        }
        setIsWebcamActive(true)
        
        if (finalVideoRef.current) {
          finalVideoRef.current.srcObject = localStream
        }
      } catch (error) {
        console.error("웹캠 접근 오류:", error)
      }
    }
    init()
    return () => {
      stopWebcam(localStream)
      if (finalVideoRef.current) {
        finalVideoRef.current.srcObject = null
      }
    }
  }, [onStreamReady, stream])

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