"use client"

import { useState, useEffect, useRef } from "react"
import { Camera } from 'lucide-react';
interface WebcamViewProps {
  userName?: string
  isRecording?: boolean
  onStreamReady?: (stream: MediaStream) => void
  videoRef?: React.RefObject<HTMLVideoElement | null>
  voiceGifMode?: boolean
}
const username2 = typeof window !== 'undefined' ? localStorage.getItem('name') : null
export function WebcamView({ 
  userName = username2 || "김싸피", 
  isRecording = false, 
  onStreamReady,
  videoRef: externalVideoRef,
  voiceGifMode = false
}: WebcamViewProps) {
  const [isWebcamActive, setIsWebcamActive] = useState(false)
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)
  const [hasFrames, setHasFrames] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const internalVideoRef = useRef<HTMLVideoElement>(null)
  const finalVideoRef = externalVideoRef || internalVideoRef
  const currentStreamRef = useRef<MediaStream | null>(null)
  // 캔버스 미러링은 호환성 이슈가 있어 비활성화
  const framePollRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastAboveThresholdMsRef = useRef<number>(0)

  type ExtendedVideoEl = HTMLVideoElement & {
    srcObject?: MediaStream | null
    requestVideoFrameCallback?: (cb: (now: number, metadata: object) => void) => number
  }

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
    // srcObject 연결 (대부분 브라우저 지원)
    const videoEl = finalVideoRef.current as ExtendedVideoEl
    if ('srcObject' in videoEl) {
      videoEl.srcObject = stream
    }
    currentStreamRef.current = stream
    // 강제 로드 시도
    try { finalVideoRef.current.load?.() } catch {}
    try {
      await finalVideoRef.current.play()
      setAutoplayBlocked(false)
      // 프레임 감지: 다양한 이벤트 및 폴백 사용
      const videoEl = finalVideoRef.current as ExtendedVideoEl
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
        // EventTarget 표준 addEventListener 사용
        try {
          vt.addEventListener('unmute', () => handleUnmute(), { once: true } as AddEventListenerOptions)
        } catch {}
        // 폴백: onunmute 핸들러
        try {
          vt.onunmute = () => handleUnmute()
        } catch {}
      }
      // requestVideoFrameCallback 사용 가능 시 즉시 프레임 감지
      if (typeof videoEl.requestVideoFrameCallback === 'function') {
        videoEl.requestVideoFrameCallback(() => setHasFrames(true))
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

  // 음성 인식(발화 감지) 초기화
  useEffect(() => {
    if (!voiceGifMode) return
    let cancelled = false
    const initAudioDetection = async () => {
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        if (cancelled) {
          micStream.getTracks().forEach(t => t.stop())
          return
        }
        micStreamRef.current = micStream
        // 호환: 표준 AudioContext 우선, 없으면 webkitAudioContext 사용
        let audioContext: AudioContext
        if ('AudioContext' in window) {
          const Ctor = window.AudioContext as {
            new (contextOptions?: AudioContextOptions): AudioContext
          }
          audioContext = new Ctor()
        } else if ('webkitAudioContext' in window) {
          const Ctor = (window as unknown as {
            webkitAudioContext: { new (contextOptions?: AudioContextOptions): AudioContext }
          }).webkitAudioContext
          audioContext = new Ctor()
        } else {
          throw new Error('Web Audio API not supported')
        }
        audioContextRef.current = audioContext
        const source = audioContext.createMediaStreamSource(micStream)
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 2048
        analyser.smoothingTimeConstant = 0.8
        analyserRef.current = analyser
        source.connect(analyser)

        const data = new Uint8Array(analyser.frequencyBinCount)
        const SPEAKING_THRESHOLD = 12 // 임계값(조정 가능)
        const SILENCE_HOLD_MS = 3000  // 무음 3초 유지 시에만 비발화로 전환

        const loop = () => {
          if (!analyserRef.current) return
          analyserRef.current.getByteTimeDomainData(data)
          // 128 기준으로 편차 RMS 계산
          let sumSquares = 0
          for (let i = 0; i < data.length; i++) {
            const v = data[i] - 128
            sumSquares += v * v
          }
          const rms = Math.sqrt(sumSquares / data.length)
          const isNowSpeaking = rms > SPEAKING_THRESHOLD
          const now = performance.now()
          if (isNowSpeaking) {
            // 발화 감지: 즉시 speaking 전환, 타임스탬프 갱신
            if (!isSpeaking) {
              setIsSpeaking(true)
            }
            lastAboveThresholdMsRef.current = now
          } else {
            // 무음: 마지막 발화 시점으로부터 3초 경과 시에만 speaking 해제
            if (isSpeaking) {
              if (now - lastAboveThresholdMsRef.current >= SILENCE_HOLD_MS) {
                setIsSpeaking(false)
              }
            }
          }
          rafRef.current = requestAnimationFrame(loop)
        }
        rafRef.current = requestAnimationFrame(loop)
      } catch (e) {
        console.warn('마이크 접근/분석 초기화 실패:', e)
      }
    }

    initAudioDetection()
    return () => {
      cancelled = true
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      if (analyserRef.current) {
        try { analyserRef.current.disconnect() } catch {}
        analyserRef.current = null
      }
      if (audioContextRef.current) {
        try { audioContextRef.current.close() } catch {}
        audioContextRef.current = null
      }
      if (micStreamRef.current) {
        try { micStreamRef.current.getTracks().forEach(t => t.stop()) } catch {}
        micStreamRef.current = null
      }
    }
  }, [voiceGifMode, isSpeaking])

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
      <h3 className="text-lg font-semibold text-gray-800 mb-4">훈련 친구, 금이</h3>

      {/* 웹캠 화면 */}
      <div className="relative bg-gray-900 aspect-square rounded-xl overflow-hidden mb-6">
        {!isWebcamActive ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl"><Camera /></span>
              </div>
              <p className="text-sm">카메라가 껴져있습니다. 사용자 님의 감정을 파악하기 위해 카메라를 켜주세요.</p>
            </div>
          </div>
        ) : (
          <>
            {voiceGifMode ? (
              <img
                src={isSpeaking ? "/images/hearfox.gif" : "/images/speepfox.gif"}
                alt={isSpeaking ? "말하는 중" : "대기 중"}
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                ref={finalVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}
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
    
      </div>


    </div>
  )
} 