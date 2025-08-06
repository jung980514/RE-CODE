import { TTSConfig, TTSResponse, TTSVoice, TTSState } from './types'

class TTSService {
  private speechSynthesis: SpeechSynthesis | null = null
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private state: TTSState = {
    isEnabled: true,
    isPlaying: false,
    volume: 0.8,
    rate: 0.9,
    pitch: 1.0
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.speechSynthesis = window.speechSynthesis
    }
  }

  // TTS 초기화
  async initialize(): Promise<boolean> {
    if (!this.speechSynthesis) {
      console.error('Speech synthesis not supported')
      return false
    }

    // 음성 목록 로드 대기
    if (this.speechSynthesis.getVoices().length === 0) {
      return new Promise((resolve) => {
        this.speechSynthesis!.onvoiceschanged = () => {
          console.log('TTS voices loaded')
          resolve(true)
        }
      })
    }

    return true
  }

  // 한국어 음성 찾기
  getKoreanVoice(): TTSVoice | null {
    if (!this.speechSynthesis) return null

    const voices = this.speechSynthesis.getVoices()
    const koreanVoice = voices.find(voice => 
      voice.lang.includes('ko') || voice.lang.includes('ko-KR')
    )

    if (koreanVoice) {
      return {
        name: koreanVoice.name,
        languageCode: koreanVoice.lang,
        gender: koreanVoice.name.includes('Female') ? 'FEMALE' : 'MALE',
        naturalSampleRateHertz: 22050
      }
    }

    return null
  }

  // TTS 재생
  async speak(config: TTSConfig): Promise<TTSResponse> {
    try {
      if (!this.speechSynthesis) {
        return { success: false, error: 'Speech synthesis not supported' }
      }

      // 이전 TTS 중지
      this.stop()

      const utterance = new SpeechSynthesisUtterance(config.text)
      
      // 한국어 음성 설정
      const koreanVoice = this.getKoreanVoice()
      if (koreanVoice) {
        const voices = this.speechSynthesis.getVoices()
        const voice = voices.find(v => v.name === koreanVoice.name)
        if (voice) {
          utterance.voice = voice
        }
      }

      // 기본 설정
      utterance.lang = config.language || 'ko-KR'
      utterance.rate = config.rate || this.state.rate
      utterance.pitch = config.pitch || this.state.pitch
      utterance.volume = config.volume || this.state.volume

      // 이벤트 핸들러
      utterance.onstart = () => {
        this.state.isPlaying = true
        console.log('TTS started:', config.text)
      }

      utterance.onend = () => {
        this.state.isPlaying = false
        this.currentUtterance = null
        console.log('TTS ended')
      }

      utterance.onerror = (event) => {
        this.state.isPlaying = false
        this.currentUtterance = null
        
        if (event.error !== 'interrupted') {
          console.error('TTS error:', event.error)
          return { success: false, error: event.error }
        } else {
          console.log('TTS interrupted (normal)')
        }
      }

      this.currentUtterance = utterance
      this.speechSynthesis.speak(utterance)

      return { success: true }
    } catch (error) {
      console.error('TTS speak error:', error)
      return { success: false, error: String(error) }
    }
  }

  // TTS 중지
  stop(): void {
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel()
      this.state.isPlaying = false
      this.currentUtterance = null
      console.log('TTS stopped')
    }
  }

  // TTS 일시정지
  pause(): void {
    if (this.speechSynthesis) {
      this.speechSynthesis.pause()
    }
  }

  // TTS 재개
  resume(): void {
    if (this.speechSynthesis) {
      this.speechSynthesis.resume()
    }
  }

  // 상태 가져오기
  getState(): TTSState {
    return { ...this.state }
  }

  // 상태 업데이트
  updateState(updates: Partial<TTSState>): void {
    this.state = { ...this.state, ...updates }
  }

  // 음성 목록 가져오기
  getVoices(): TTSVoice[] {
    if (!this.speechSynthesis) return []

    return this.speechSynthesis.getVoices().map(voice => ({
      name: voice.name,
      languageCode: voice.lang,
      gender: voice.name.includes('Female') ? 'FEMALE' : 'MALE',
      naturalSampleRateHertz: 22050
    }))
  }

  // 현재 재생 중인지 확인
  isPlaying(): boolean {
    return this.state.isPlaying
  }

  // TTS 활성화 상태 확인
  isEnabled(): boolean {
    return this.state.isEnabled
  }
}

// 싱글톤 인스턴스 생성
export const ttsService = new TTSService() 