"use client"

import { useState, useEffect, useRef } from "react"
import { Camera } from 'lucide-react';
interface WebcamViewProps {
  userName?: string
  isRecording?: boolean
  onStreamReady?: (stream: MediaStream) => void
  videoRef?: React.RefObject<HTMLVideoElement | null>
}
const username2 = typeof window !== 'undefined' ? localStorage.getItem('name') : null
export function WebcamView({ 
  userName = username2 || "김싸피", 
  isRecording = false, 
  onStreamReady,
  videoRef: externalVideoRef
}: WebcamViewProps) {
  const [isWebcamActive, setIsWebcamActive] = useState(false)
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)
  const [hasFrames, setHasFrames] = useState(false)
  const internalVideoRef = useRef<HTMLVideoElement>(null)
  const finalVideoRef = externalVideoRef || internalVideoRef
  const currentStreamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)

  const attachAndPlay = async (stream: MediaStream) => {
    if (!finalVideoRef.current) return
    // 트랙 활성화 보장
    stream.getVideoTracks().forEach(t => (t.enabled = true))
    // 비디오 속성 보장 (iOS Safari 호환)
    finalVideoRef.current.muted = true
    finalVideoRef.current.setAttribute('muted', '')
    finalVideoRef.current.playsInline = true
    finalVideoRef.current.setAttribute('playsinline', '')
    // @ts-ignore - webkit 전용 속성
    finalVideoRef.current.setAttribute('webkit-playsinline', '')
    // DOM 페인트 이후 연결 시도
    await new Promise(requestAnimationFrame)
    finalVideoRef.current.srcObject = stream
    currentStreamRef.current = stream
    try {
      await finalVideoRef.current.play()
      setAutoplayBlocked(false)
      // 프레임 감지: playing 이벤트 또는 videoWidth 체크
      const onPlaying = () => setHasFrames(true)
      finalVideoRef.current.addEventListener('playing', onPlaying, { once: true })
      // 시간차로 보조 체크
      setTimeout(() => {
        if (finalVideoRef.current && finalVideoRef.current.videoWidth > 0) {
          setHasFrames(true)
        }
      }, 800)

      // 캔버스 미러링 시작 (검은 화면 회피용)
      startCanvasMirroring()
    } catch (e) {
      setAutoplayBlocked(true)
      finalVideoRef.current.onloadedmetadata = async () => {
        try {
          await finalVideoRef.current?.play()
          setAutoplayBlocked(false)
          if (finalVideoRef.current && finalVideoRef.current.videoWidth > 0) {
            setHasFrames(true)
          }
          startCanvasMirroring()
        } catch {
          setAutoplayBlocked(true)
        }
      }
    }
  }

  const startCanvasMirroring = () => {
    if (!finalVideoRef.current || !canvasRef.current) return
    const videoEl = finalVideoRef.current
    const canvasEl = canvasRef.current
    const ctx = canvasEl.getContext('2d')
    if (!ctx) return

    const draw = () => {
      if (!videoEl.paused && !videoEl.ended) {
        const vw = videoEl.videoWidth || 640
        const vh = videoEl.videoHeight || 480
        if (canvasEl.width !== vw || canvasEl.height !== vh) {
          canvasEl.width = vw
          canvasEl.height = vh
        }
        ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height)
      }
      rafRef.current = requestAnimationFrame(draw)
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(draw)
  }

  const openWebcam = async (): Promise<MediaStream> => {
    // 1차: 권장 해상도 + 전면 카메라
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      })
    } catch (e) {
      console.warn('웹캠 제약 조건 실패, 단순 모드로 재시도합니다:', e)
      // 2차: 제약 완화
      return await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    }
  }

  const startWebcam = async () => {
    try {
      const mediaStream = await openWebcam()
      if (onStreamReady) {
        onStreamReady(mediaStream)
      }
      setIsWebcamActive(true)
      setHasFrames(false)
      
      if (finalVideoRef.current) {
        await attachAndPlay(mediaStream)
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
        stream = await openWebcam()
        // 트랙 활성화 보장
        stream.getVideoTracks().forEach(t => (t.enabled = true))
        if (onStreamReady) {
          onStreamReady(stream)
        }
        setIsWebcamActive(true)
        setHasFrames(false)
        
        if (finalVideoRef.current) {
          await attachAndPlay(stream)
        }

        // 2초 내 프레임 미도착 시, 제약 완화 재시도
        setTimeout(async () => {
          if (finalVideoRef.current && isWebcamActive && !hasFrames) {
            try {
              const retry = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
              await attachAndPlay(retry)
            } catch {}
          }
        }, 2000)
      } catch (error) {
        console.error("웹캠 접근 오류:", error)
      }
    }
    init()
    return () => {
      // 재생 중지 및 srcObject 해제
      if (finalVideoRef.current) {
        try { finalVideoRef.current.pause() } catch {}
        // @ts-expect-error - srcObject는 표준 속성
        finalVideoRef.current.srcObject = null
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      stopWebcam(stream)
      currentStreamRef.current = null
      setHasFrames(false)
    }
  }, [onStreamReady])

  // 가시성 회복 시 재생 재시도 (모바일 사파리 등)
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState === 'visible' && finalVideoRef.current && currentStreamRef.current) {
        try {
          // srcObject 재할당 후 재생 재시도
          finalVideoRef.current.srcObject = currentStreamRef.current
          await finalVideoRef.current.play()
          setAutoplayBlocked(false)
        } catch {
          setAutoplayBlocked(true)
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  return (
    <div className="text-center">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">내 화면({userName})</h3>

      {/* 웹캠 화면 */}
      <div className="relative bg-gray-900 aspect-square rounded-xl overflow-hidden mb-6">
        {!isWebcamActive ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl"><Camera /></span>
              </div>
              <p className="text-sm">카메라를 불러오는 중...</p>
            </div>
          </div>
        ) : (
          <>
            {/* 비디오 엘리먼트는 숨겨둔 채 캔버스에 미러링 */}
            <video
              ref={finalVideoRef}
              autoPlay
              playsInline
              muted
              className="hidden"
            />
            <canvas ref={canvasRef} className="w-full h-full object-cover" />
          </>
        )}

        {isWebcamActive && autoplayBlocked && (
          <button
            type="button"
            onClick={async () => {
              if (finalVideoRef.current) {
                try {
                  await finalVideoRef.current.play()
                  setAutoplayBlocked(false)
                } catch {
                  setAutoplayBlocked(true)
                }
              }
            }}
            className="absolute inset-0 bg-black/40 text-white flex items-center justify-center text-sm"
            aria-label="웹캠 재생"
          >
            탭하여 웹캠 재생
          </button>
        )}

        {/* 재시도 버튼 (디버그/폴백) */}
        {(!isWebcamActive || autoplayBlocked || (isWebcamActive && !hasFrames)) && (
          <div className="absolute bottom-3 left-3">
            <button
              type="button"
              onClick={async () => {
                // 우선 비디오 재생 재시도
                if (finalVideoRef.current && currentStreamRef.current) {
                  try {
                    finalVideoRef.current.srcObject = currentStreamRef.current
                    await finalVideoRef.current.play()
                    setAutoplayBlocked(false)
                    if (finalVideoRef.current.videoWidth > 0) setHasFrames(true)
                  } catch {
                    setAutoplayBlocked(true)
                  }
                }
                // 여전히 비활성화면 사용자 제스처로 스트림 재요청
                if (!isWebcamActive) {
                  try {
                    // 기존 스트림 정지
                    if (currentStreamRef.current) {
                      currentStreamRef.current.getTracks().forEach(t => t.stop())
                      currentStreamRef.current = null
                    }
                    await startWebcam()
                  } catch {}
                }
              }}
              className="px-2 py-1 text-xs bg-white/80 text-gray-800 rounded"
            >
              웹캠 시작/재시도
            </button>
          </div>
        )}

        {/* 프레임 없음 안내 */}
        {isWebcamActive && !hasFrames && !autoplayBlocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <p className="text-white text-xs">카메라 신호 대기 중...</p>
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