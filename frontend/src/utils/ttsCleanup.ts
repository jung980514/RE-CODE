import { googleTTSService } from "@/api/googleTTS/googleTTSService"

/*
 * 페이지 이탈 시 GTTS를 중지하는 유틸리티 함수들
*/

// 모든 오디오 요소를 강제로 중지
export const forceStopAllAudio = () => {
  try {
    // 모든 audio 요소 찾기
    const allAudioElements = document.querySelectorAll('audio')
    allAudioElements.forEach(audio => {
      audio.pause()
      audio.currentTime = 0
      audio.src = ''
      audio.load()
      audio.muted = true
      audio.volume = 0
    })

    // 모든 video 요소도 중지 (혹시 모를 경우)
    const allVideoElements = document.querySelectorAll('video')
    allVideoElements.forEach(video => {
      video.pause()
      video.currentTime = 0
      video.muted = true
      video.volume = 0
    })

    // GTTS 서비스 중지
    googleTTSService.stop()
    
    console.log('모든 오디오 강제 중지 완료')
  } catch (error) {
    console.error('오디오 강제 중지 중 오류:', error)
  }
}

// 모든 오디오 요소를 음소거
export const muteAllAudio = () => {
  try {
    // 모든 audio 요소 음소거
    const allAudioElements = document.querySelectorAll('audio')
    allAudioElements.forEach(audio => {
      audio.muted = true
      audio.volume = 0
    })

    // 모든 video 요소 음소거
    const allVideoElements = document.querySelectorAll('video')
    allVideoElements.forEach(video => {
      video.muted = true
      video.volume = 0
    })

    console.log('모든 오디오 음소거 완료')
  } catch (error) {
    console.error('오디오 음소거 중 오류:', error)
  }
}

// 페이지 이탈 감지 이벤트 리스너 설정
export const setupTTSLeaveDetection = () => {
  const handleBeforeUnload = () => {
    console.log('페이지 이탈 감지: beforeunload')
    muteAllAudio()
  }

  const handleVisibilityChange = () => {
    if (document.hidden) {
      console.log('페이지 숨김 감지: visibilitychange')
      muteAllAudio()
    }
  }

  const handleWindowBlur = () => {
    console.log('윈도우 포커스 손실 감지: blur')
    muteAllAudio()
  }

  const handleWindowFocus = () => {
    console.log('윈도우 포커스 획득 감지: focus')
    // 포커스를 얻었을 때도 안전장치로 음소거
    muteAllAudio()
  }

  // 이벤트 리스너 등록
  window.addEventListener('beforeunload', handleBeforeUnload)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('blur', handleWindowBlur)
  window.addEventListener('focus', handleWindowFocus)

  // 정리 함수 반환
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('blur', handleWindowBlur)
    window.removeEventListener('focus', handleWindowFocus)
    muteAllAudio()
  }
}

// 현재 재생 중인 모든 미디어 상태 확인
export const checkMediaStatus = () => {
  const audioElements = document.querySelectorAll('audio')
  const videoElements = document.querySelectorAll('video')
  
  console.log('=== 미디어 상태 확인 ===')
  console.log(`오디오 요소 수: ${audioElements.length}`)
  console.log(`비디오 요소 수: ${videoElements.length}`)
  
  audioElements.forEach((audio, index) => {
    console.log(`오디오 ${index + 1}:`, {
      paused: audio.paused,
      currentTime: audio.currentTime,
      duration: audio.duration,
      volume: audio.volume,
      muted: audio.muted,
      src: audio.src
    })
  })
  
  videoElements.forEach((video, index) => {
    console.log(`비디오 ${index + 1}:`, {
      paused: video.paused,
      currentTime: video.currentTime,
      duration: video.duration,
      volume: video.volume,
      muted: video.muted,
      src: video.src
    })
  })
} 