import { useState, useEffect, useCallback } from 'react'
import { googleTTSService } from './googleTTSService'
import { TTSConfig, TTSState } from './types'

export const useGoogleTTS = () => {
  const [state, setState] = useState<TTSState>({
    isEnabled: true,
    isPlaying: false,
    volume: 0.8,
    rate: 0.9,
    pitch: 1.0
  })

  // TTS 초기화
  useEffect(() => {
    const initializeTTS = async () => {
      const success = await googleTTSService.initialize()
      if (success) {
        setState(prev => ({ ...prev, isEnabled: true }))
        console.log('Google TTS 초기화 성공')
      } else {
        console.error('Google TTS 초기화 실패')
      }
    }

    initializeTTS()
  }, [])

  // 상태 동기화
  useEffect(() => {
    const syncState = () => {
      const serviceState = googleTTSService.getState()
      setState(serviceState)
    }

    // 주기적으로 상태 동기화
    const interval = setInterval(syncState, 100)
    return () => clearInterval(interval)
  }, [])

  // TTS 재생
  const speak = useCallback(async (config: TTSConfig) => {
    const result = await googleTTSService.speak(config)
    if (result.success) {
      setState(prev => ({ ...prev, isPlaying: true }))
    }
    return result
  }, [])

  // TTS 중지
  const stop = useCallback(() => {
    googleTTSService.stop()
    setState(prev => ({ ...prev, isPlaying: false }))
  }, [])

  // TTS 일시정지
  const pause = useCallback(() => {
    googleTTSService.pause()
  }, [])

  // TTS 재개
  const resume = useCallback(() => {
    googleTTSService.resume()
  }, [])

  // TTS 활성화/비활성화
  const toggleEnabled = useCallback(() => {
    const newEnabled = !state.isEnabled
    googleTTSService.updateState({ isEnabled: newEnabled })
    setState(prev => ({ ...prev, isEnabled: newEnabled }))
  }, [state.isEnabled])

  // 볼륨 설정
  const setVolume = useCallback((volume: number) => {
    googleTTSService.updateState({ volume })
    setState(prev => ({ ...prev, volume }))
  }, [])

  // 속도 설정
  const setRate = useCallback((rate: number) => {
    googleTTSService.updateState({ rate })
    setState(prev => ({ ...prev, rate }))
  }, [])

  // 음성 높이 설정
  const setPitch = useCallback((pitch: number) => {
    googleTTSService.updateState({ pitch })
    setState(prev => ({ ...prev, pitch }))
  }, [])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      googleTTSService.stop()
    }
  }, [])

  return {
    state,
    speak,
    stop,
    pause,
    resume,
    toggleEnabled,
    setVolume,
    setRate,
    setPitch,
    isPlaying: state.isPlaying,
    isEnabled: state.isEnabled
  }
} 