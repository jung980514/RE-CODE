export interface TTSConfig {
  text: string
  language?: string
  voice?: string
  rate?: number
  pitch?: number
  volume?: number
}

export interface TTSResponse {
  success: boolean
  audioUrl?: string
  error?: string
}

export interface TTSVoice {
  name: string
  languageCode: string
  gender: 'MALE' | 'FEMALE' | 'NEUTRAL'
  naturalSampleRateHertz: number
}

export interface TTSState {
  isEnabled: boolean
  isPlaying: boolean
  volume: number
  rate: number
  pitch: number
  currentVoice?: TTSVoice
} 