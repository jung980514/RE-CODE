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
  // 캔버스 미러링은 호환성 이슈가 있어 비활성화
  const framePollRef = useRef<number | null>(null)

  const attachAndPlay = async (stream: MediaStream) => {
    if (!finalVideoRef.current) return
    // 트랙 활성화 보장
    stream.getVideoTracks().forEach(t => (t.enabled = true))
    // 비디오 속성 보장 (iOS Safari 호환)
    finalVideoRef.current.muted = true
    finalVideoRef.current.setAttribute('muted', '')
    finalVideoRef.current.playsInline = true
    finalVideoRef.current.setAttribute('playsinline', '')
    finalVideoRef.current.setAttribute('webkit-playsinline', '')
    // DOM 페인트 이후 연결 시도
    await new Promise(requestAnimationFrame)
    // srcObject 우선, 미지원 브라우저는 createObjectURL 폴백
    const videoElAny = finalVideoRef.current as any
    if ('srcObject' in videoElAny) {
      videoElAny.srcObject = stream
    } else {
      // @ts-ignore - 구형 브라우저 폴백
      finalVideoRef.current.src = URL.createObjectURL(stream)
    }
    currentStreamRef.current = stream
    // 강제 로드 시도
    try { finalVideoRef.current.load?.() } catch {}
    try {
      await finalVideoRef.current.play()
      setAutoplayBlocked(false)
      // 프레임 감지: 다양한 이벤트 및 폴백 사용
      const videoEl = finalVideoRef.current
      const onPlaying = () => setHasFrames(true)
      const onCanPlay = () => setHasFrames(true)
      const onLoadedMeta = () => {
        if (videoEl.videoWidth > 0) setHasFrames(true)
      }
      const onLoadedData = () => {
        if (videoEl.videoWidth > 0 || videoEl.readyState >= 2) setHasFrames(true)
      }
      const onTimeUpdate = () => {
        if (videoEl.currentTime > 0) setHasFrames(true)
      }
      videoEl.addEventListener('playing', onPlaying, { once: true })
      videoEl.addEventListener('canplay', onCanPlay, { once: true })
      videoEl.addEventListener('loadedmetadata', onLoadedMeta, { once: true })
      videoEl.addEventListener('loadeddata', onLoadedData, { once: true })
      videoEl.addEventListener('timeupdate', onTimeUpdate, { once: true })
      videoEl.addEventListener('resize', onPlaying, { once: true })
      // 트랙 unmute 시 프레임 도착으로 간주
      const vt = stream.getVideoTracks()[0]
      if (vt) {
        const handleUnmute = () => setHasFrames(true)
        // 일부 브라우저는 addEventListener 지원, 없으면 onunmute 폴백
        try {
          // @ts-ignore - 일부 브라우저 타입 정의 미비
          vt.addEventListener?.('unmute', handleUnmute, { once: true })
        } catch {}
        // @ts-ignore - 폴백 핸들러
        if (!('addEventListener' in vt)) {
          // @ts-ignore - 폴백 속성
          vt.onunmute = handleUnmute
        }
      }
      // requestVideoFrameCallback 사용 가능 시 즉시 프레임 감지
      // @ts-ignore - 실험적 API 체크
      if (typeof (videoEl as any).requestVideoFrameCallback === 'function') {
        // @ts-ignore - 실험적 API 호출
        (videoEl as any).requestVideoFrameCallback(() => setHasFrames(true))
      }
      // 주기 폴링 (최대 3초): videoWidth/readyState 확인
      if (framePollRef.current) {
        window.clearInterval(framePollRef.current)
        framePollRef.current = null
      }
      let elapsed = 0
      framePollRef.current = window.setInterval(() => {
        elapsed += 200
        if (!finalVideoRef.current) return
        const v = finalVideoRef.current
        if ((v.videoWidth > 0 && v.readyState >= 2) || v.currentTime > 0) {
          setHasFrames(true)
          if (framePollRef.current) {
            window.clearInterval(framePollRef.current)
            framePollRef.current = null
          }
        }
        if (elapsed >= 3000 && framePollRef.current) {
          window.clearInterval(framePollRef.current)
          framePollRef.current = null
        }
      }, 200)
    } catch (e) {
      setAutoplayBlocked(true)
      finalVideoRef.current.onloadedmetadata = async () => {
        try {
          await finalVideoRef.current?.play()
          setAutoplayBlocked(false)
          if (finalVideoRef.current && finalVideoRef.current.videoWidth > 0) {
            setHasFrames(true)
          }
        } catch {
          setAutoplayBlocked(true)
        }
      }
    }
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
        finalVideoRef.current.srcObject = null
      }
      if (framePollRef.current) {
        window.clearInterval(framePollRef.current)
        framePollRef.current = null
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
            <video
              ref={finalVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
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