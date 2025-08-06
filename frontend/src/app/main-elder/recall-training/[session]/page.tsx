"use client"

import { useParams, useRouter } from "next/navigation"
import { VoiceMemoryTrainingSession } from "../components/VoiceMemoryTrainingSession"
import { VoicePhotoReminiscenceSession } from "../components/VoicePhotoReminiscenceSession"
import { VoiceMusicTherapySession } from "../components/VoiceMusicTherapySession"
import { VoiceStoryTellingSession } from "../components/VoiceStoryTellingSession"

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.session as string

  const handleBack = () => {
    router.push('/main-elder/recall-training')
  }

  const renderSession = () => {
    switch (sessionId) {
      case 'memory':
        return <VoiceMemoryTrainingSession onBack={handleBack} />
      case 'photo':
        return <VoicePhotoReminiscenceSession onBack={handleBack} />
      case 'music':
        return <VoiceMusicTherapySession onBack={handleBack} />
      case 'story':
        return <VoiceStoryTellingSession onBack={handleBack} />
      default:
        return <div>세션을 찾을 수 없습니다.</div>
    }
  }

  return renderSession()
} 