"use client"

import { useParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Suspense } from "react"

const VoiceMemoryTrainingSession = dynamic(
  () =>
    import("../components/VoiceMemoryTrainingSession").then(
      (mod) => mod.VoiceMemoryTrainingSession,
    ),
  { ssr: false },
)
const VoicePhotoReminiscenceSession = dynamic(
  () =>
    import("../components/VoicePhotoReminiscenceSession").then(
      (mod) => mod.VoicePhotoReminiscenceSession,
    ),
  { ssr: false },
)
const VoiceMusicTherapySession = dynamic(
  () =>
    import("../components/VoiceMusicTherapySession").then(
      (mod) => mod.VoiceMusicTherapySession,
    ),
  { ssr: false },
)
const VoiceStoryTellingSession = dynamic(
  () =>
    import("../components/VoiceStoryTellingSession").then(
      (mod) => mod.default,
    ),
  { ssr: false },
)

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.session as string

  const handleBack = () => {
    router.push("/main-elder/recall-training")
  }

  const renderSession = () => {
    switch (sessionId) {
      case "memory":
        return <VoiceMemoryTrainingSession onBack={handleBack} />
      case "photo":
        return <VoicePhotoReminiscenceSession onBack={handleBack} />
      case "music":
        return <VoiceMusicTherapySession onBack={handleBack} />
      case "story":
        return <VoiceStoryTellingSession onBack={handleBack} />
      default:
        return <div>세션을 찾을 수 없습니다.</div>
    }
  }

  return <Suspense fallback={<div>Loading...</div>}>{renderSession()}</Suspense>
} 