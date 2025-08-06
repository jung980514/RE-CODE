const API_KEY = 'AIzaSyD6xmTJu-jcODyYYlAMptTF-AWouFfIgE4';

interface TTSState {
  isEnabled: boolean;
  isPlaying: boolean;
  volume: number;
  rate: number;
  pitch: number;
}

interface TTSRequest {
  input: {
    text: string;
  };
  voice: {
    languageCode: string;
    name: string;
  };
  audioConfig: {
    audioEncoding: string;
    pitch: number;
    speakingRate: number;
  };
}

export const synthesizeSpeech = async (text: string): Promise<string> => {
  try {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: 'ko-KR',
            name: 'ko-KR-Neural2-A',
          },
          audioConfig: {
            audioEncoding: 'MP3',
            pitch: 0,
            speakingRate: 1,
          },
        } as TTSRequest),
      }
    );

    if (!response.ok) {
      throw new Error('TTS API 요청 실패');
    }

    const data = await response.json();
    return data.audioContent; // Base64 encoded audio content
  } catch (error) {
    console.error('TTS 에러:', error);
    throw error;
  }
};

let currentAudio: HTMLAudioElement | null = null;

export const playAudio = async (base64Audio: string): Promise<void> => {
  try {
    // 새로운 오디오 생성
    const newAudio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
    
    // 기존 오디오가 있다면 정지
    if (currentAudio) {
      const oldAudio = currentAudio;
      currentAudio = null;  // 먼저 currentAudio를 null로 설정
      oldAudio.pause();
      oldAudio.currentTime = 0;
    }

    // 새 오디오 설정 및 재생
    currentAudio = newAudio;
    
    // 로드 완료 후 재생 시작
    await new Promise((resolve, reject) => {
      newAudio.onloadeddata = async () => {
        try {
          await newAudio.play();
          resolve(undefined);
        } catch (error) {
          reject(error);
        }
      };
      newAudio.onerror = () => reject(new Error('오디오 로드 실패'));
    });

    // 재생이 끝나면 currentAudio 초기화
    newAudio.onended = () => {
      if (currentAudio === newAudio) {
        currentAudio = null;
      }
    };
  } catch (error) {
    console.error('오디오 재생 에러:', error);
    if (currentAudio) {
      currentAudio = null;
    }
    throw error;
  }
};

export const stopCurrentAudio = () => {
  if (currentAudio) {
    const audio = currentAudio;
    currentAudio = null;  // 먼저 currentAudio를 null로 설정
    audio.pause();
    audio.currentTime = 0;
  }
};

class GoogleTTSService {
  private state: TTSState = {
    isEnabled: true,
    isPlaying: false,
    volume: 0.8,
    rate: 0.9,
    pitch: 1.0
  };

  private audio: HTMLAudioElement | null = null;

  async initialize(): Promise<boolean> {
    return true;
  }

  getState(): TTSState {
    return { ...this.state };
  }

  updateState(newState: Partial<TTSState>): void {
    this.state = { ...this.state, ...newState };
  }

  async speak(config: { text: string; language?: string; rate?: number; pitch?: number; volume?: number }): Promise<{ success: boolean; error?: string }> {
    try {
      const audioContent = await synthesizeSpeech(config.text);
      this.audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
      
      if (config.volume) this.audio.volume = config.volume;
      
      await this.audio.play();
      this.state.isPlaying = true;
      
      this.audio.onended = () => {
        this.state.isPlaying = false;
      };

      return { success: true };
    } catch (error) {
      console.error('TTS 에러:', error);
      return { success: false, error: '음성 변환 실패' };
    }
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.state.isPlaying = false;
    }
  }

  pause(): void {
    if (this.audio) {
      this.audio.pause();
      this.state.isPlaying = false;
    }
  }

  resume(): void {
    if (this.audio) {
      this.audio.play();
      this.state.isPlaying = true;
    }
  }

  setVolume(volume: number): void {
    this.state.volume = volume;
    if (this.audio) {
      this.audio.volume = volume;
    }
  }

  setRate(rate: number): void {
    this.state.rate = rate;
  }

  setPitch(pitch: number): void {
    this.state.pitch = pitch;
  }
}

export const googleTTSService = new GoogleTTSService();