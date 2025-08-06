import { useState, useEffect, useCallback } from 'react'
import { ttsService } from './ttsService'
import { TTSConfig, TTSState } from './types'

export const useTTS = () => {
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
      const success = await ttsService.initialize()
      if (success) {
        setState(prev => ({ ...prev, isEnabled: true }))
      }
    }

    initializeTTS()
  }, [])

  // 상태 동기화
  useEffect(() => {
    const syncState = () => {
      const serviceState = ttsService.getState()
      setState(serviceState)
    }

    // 주기적으로 상태 동기화
    const interval = setInterval(syncState, 100)
    return () => clearInterval(interval)
  }, [])

  // TTS 재생
  const speak = useCallback(async (config: TTSConfig) => {
    const result = await ttsService.speak(config)
    if (result.success) {
      setState(prev => ({ ...prev, isPlaying: true }))
    }
    return result
  }, [])

  // TTS 중지
  const stop = useCallback(() => {
    ttsService.stop()
    setState(prev => ({ ...prev, isPlaying: false }))
  }, [])

  // TTS 일시정지
  const pause = useCallback(() => {
    ttsService.pause()
  }, [])

  // TTS 재개
  const resume = useCallback(() => {
    ttsService.resume()
  }, [])

  // TTS 활성화/비활성화
  const toggleEnabled = useCallback(() => {
    const newEnabled = !state.isEnabled
    ttsService.updateState({ isEnabled: newEnabled })
    setState(prev => ({ ...prev, isEnabled: newEnabled }))
  }, [state.isEnabled])

  // 볼륨 설정
  const setVolume = useCallback((volume: number) => {
    ttsService.updateState({ volume })
    setState(prev => ({ ...prev, volume }))
  }, [])

  // 속도 설정
  const setRate = useCallback((rate: number) => {
    ttsService.updateState({ rate })
    setState(prev => ({ ...prev, rate }))
  }, [])

  // 음성 높이 설정
  const setPitch = useCallback((pitch: number) => {
    ttsService.updateState({ pitch })
    setState(prev => ({ ...prev, pitch }))
  }, [])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      ttsService.stop()
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