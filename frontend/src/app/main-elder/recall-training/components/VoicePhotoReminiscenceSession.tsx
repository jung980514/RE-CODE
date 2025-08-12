"use client"

import { useState, useEffect, useRef, MutableRefObject } from "react"
import * as faceapi from '@vladmandic/face-api'
import { Button } from "@/components/ui/button"
import { synthesizeSpeech, playAudio, stopCurrentAudio } from "@/api/googleTTS/googleTTSService"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { WebcamView } from "@/components/common/WebcamView"
import {
  ArrowLeft,
  ArrowRight,
  Mic,
  MicOff,
  CheckCircle,
  Maximize,
  Camera,
  RotateCcw,
} from "lucide-react"
import { markRecallTrainingSessionAsCompleted } from "@/lib/auth"

interface VoiceSessionProps {
  onBack: () => void
}

// 음성 및 영상 녹화 훅
function useVoiceRecording(videoStream: MediaStream | null) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [recordedMedia, setRecordedMedia] = useState<string | null>(null)
  const [isAutoRecording, setIsAutoRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const combinedStreamRef = useRef<MediaStream | null>(null)

  const startRecording = async (isAuto = false) => {
    try {
      // 기존 TTS 정지
      stopCurrentAudio()
      
      // 기존 스트림 정리
      if (combinedStreamRef.current) {
        combinedStreamRef.current.getTracks().forEach((track) => track.stop())
      }
      
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const newVideoStream = await navigator.mediaDevices.getUserMedia({ video: true })
      
      const tracks = [...audioStream.getAudioTracks(), ...newVideoStream.getVideoTracks()]
      
      const combinedStream = new MediaStream(tracks)
      combinedStreamRef.current = combinedStream

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: "video/mp4",
      })
      mediaRecorderRef.current = mediaRecorder

      // 오디오 레벨 감지
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(audioStream)
      microphone.connect(analyser)
      audioContextRef.current = audioContext

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      const updateAudioLevel = () => {
        if (isRecording) {
          analyser.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          setAudioLevel(average)
          requestAnimationFrame(updateAudioLevel)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setIsAutoRecording(isAuto)
      updateAudioLevel()

      mediaRecorder.ondataavailable = (event) => {
        const mediaBlob = new Blob([event.data], { type: "video/mp4" })
        const mediaUrl = URL.createObjectURL(mediaBlob)
        setRecordedMedia(mediaUrl)
      }
    } catch (error) {
      console.error("녹화 오류:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsAutoRecording(false)
      setAudioLevel(0)

      // 스트림 정리
      if (combinedStreamRef.current) {
        combinedStreamRef.current.getTracks().forEach((track) => track.stop())
      }

      if (audioContextRef.current) {
        try {
          if (audioContextRef.current.state !== 'closed') {
            // close()는 Promise 반환
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            audioContextRef.current.close()
          }
        } catch (_) {
          // 이미 closed 등은 무시
        } finally {
          audioContextRef.current = null
        }
      }
    }
  }

  const resetRecording = () => {
    // 녹화 URL 해제 및 상태 초기화
    if (recordedMedia) {
      try {
        URL.revokeObjectURL(recordedMedia)
      } catch (_) {
        // 무시
      }
    }
    setRecordedMedia(null)
    setIsRecording(false)
    setIsAutoRecording(false)
    setAudioLevel(0)

    // 스트림 정리
    if (combinedStreamRef.current) {
      combinedStreamRef.current.getTracks().forEach((track) => track.stop())
      combinedStreamRef.current = null
    }

    // 오디오 컨텍스트 안전 종료
    if (audioContextRef.current) {
      try {
        if (audioContextRef.current.state !== 'closed') {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          audioContextRef.current.close()
        }
      } catch (_) {
        // 무시
      } finally {
        audioContextRef.current = null
      }
    }
  }

  return {
    isRecording,
    audioLevel,
    recordedMedia,
    isAutoRecording,
    startRecording,
    stopRecording,
    resetRecording,
  }
}

// 감정 분석 훅
interface EmotionRecord {
  timestamp: number;
  emotion: string;
  confidence: number;
}

function useEmotionDetection(videoRef: React.RefObject<HTMLVideoElement | null>, isRecording: boolean) {
  const [emotion, setEmotion] = useState<string>('중립')
  const [confidence, setConfidence] = useState<number>(0)
  const requestRef = useRef<number | undefined>(undefined)
  const modelsLoaded = useRef<boolean>(false)
  const prevExpressions = useRef<faceapi.FaceExpressions | null>(null)
  const emotionHistory = useRef<EmotionRecord[]>([])
  const lastRecordTime = useRef<number>(0)

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'),
          faceapi.nets.faceExpressionNet.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model')
        ])
        modelsLoaded.current = true
      } catch (error) {
        console.error('모델 로드 오류:', error)
      }
    }
    loadModels()

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [])

  const detectEmotion = async () => {
    if (!modelsLoaded.current || !videoRef.current) return

    try {
      const detections = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions()

      if (detections) {
        const expressions = detections.expressions
        
        // 감정 점수 조정
        const emotionChange = prevExpressions.current ? 
          Math.abs(expressions.neutral - prevExpressions.current.neutral) : 0

        // 말하기/표정 변화 감지 로직
        const isSpeaking = emotionChange > 0.15
        const isSmiling = expressions.happy > 0.3
        const isNeutralDominant = expressions.neutral > 0.5
        
        // 슬픔 감정 보정
        const sadScore = expressions.sad
        const mouthOpenScore = Math.max(expressions.surprised, expressions.sad)
        const isMouthOpen = mouthOpenScore > 0.3
        
        // 실제 슬픔 표정 판단
        const isActuallySad = sadScore > 0.4 && !isSpeaking && !isSmiling && !isMouthOpen
        
        const adjustedExpressions = {
          ...expressions,
          surprised: expressions.surprised * (isSpeaking ? 0.3 : 0.7),
          sad: expressions.sad * (isActuallySad ? 1.0 : 0.1),
          neutral: expressions.neutral * (isNeutralDominant ? 1.4 : 1.2),
          happy: expressions.happy * (isSmiling ? 1.5 : 1.2),
          angry: expressions.angry * (isSpeaking ? 0.7 : 0.9),
          fearful: expressions.fearful * (isSpeaking ? 0.7 : 0.9),
          disgusted: expressions.disgusted * 0.8
        }

        prevExpressions.current = expressions

        let maxExpression = 'neutral'
        let maxConfidence = adjustedExpressions.neutral
        const threshold = 0.3

        Object.entries(adjustedExpressions).forEach(([expression, value]) => {
          let currentThreshold = threshold
          if (expression === 'surprised') currentThreshold = threshold * 1.5
          if (expression === 'sad') currentThreshold = threshold * 1.4
          
          if (value > maxConfidence && value > currentThreshold) {
            if (isSpeaking && (expression === 'neutral' || expression === 'happy')) {
              maxConfidence = value * 1.2
            } else {
              maxConfidence = value
            }
            maxExpression = expression
          }
        })

        const emotionMap: { [key: string]: string } = {
          neutral: '중립',
          happy: '행복',
          sad: '슬픔',
          angry: '화남',
          fearful: '두려움',
          disgusted: '혐오',
          surprised: '놀람'
        }

        const newEmotion = emotionMap[maxExpression] || '중립'
        if (maxConfidence > threshold) {
          setEmotion(newEmotion)
          setConfidence(maxConfidence)

          const now = Date.now()
          if (now - lastRecordTime.current >= 1000) {
            emotionHistory.current.push({
              timestamp: now,
              emotion: newEmotion,
              confidence: maxConfidence
            })
            lastRecordTime.current = now
          }
        }
      }
    } catch (error) {
      console.error('감정 분석 오류:', error)
    }

    requestRef.current = requestAnimationFrame(detectEmotion)
  }

  const analyzeEmotionHistory = () => {
    if (emotionHistory.current.length === 0) return;

    const emotions = emotionHistory.current;
    const totalDuration = (emotions[emotions.length - 1].timestamp - emotions[0].timestamp) / 1000; // 초 단위

    // 각 감정별 지속 시간 계산
    const emotionDurations: { [key: string]: number } = {};
    const emotionConfidences: { [key: string]: number[] } = {};

    emotions.forEach((record, index) => {
      const duration = index === emotions.length - 1
        ? 1 // 마지막 기록은 1초로 계산
        : (emotions[index + 1].timestamp - record.timestamp) / 1000;

      emotionDurations[record.emotion] = (emotionDurations[record.emotion] || 0) + duration;
      emotionConfidences[record.emotion] = emotionConfidences[record.emotion] || [];
      emotionConfidences[record.emotion].push(record.confidence);
    });

    // 중립을 제외한 감정 중 17%를 넘는 감정 찾기
    const dominantEmotion = Object.entries(emotionDurations).find(([emotion, duration]) => {
      const percentage = (duration / totalDuration * 100);
      return emotion !== '중립' && percentage > 17;
    });

    // 분석 결과 출력
    console.log('=== 감정 분석 결과 ===');
    console.log(`총 녹화 시간: ${totalDuration.toFixed(1)}초`);
    
    if (dominantEmotion) {
      // 중립을 제외한 감정이 17%를 넘는 경우 해당 감정만 출력
      const [emotion, duration] = dominantEmotion;
      const percentage = (duration / totalDuration * 100).toFixed(1);
      const avgConfidence = (emotionConfidences[emotion].reduce((a, b) => a + b, 0) / emotionConfidences[emotion].length * 100).toFixed(1);
      console.log(`주요 감정: ${emotion} (${percentage}%, 평균 신뢰도: ${avgConfidence}%)`);
    } else {
      // 중립을 제외한 감정이 17%를 넘지 않는 경우 중립만 출력
      const neutralDuration = emotionDurations['중립'] || 0;
      const neutralPercentage = (neutralDuration / totalDuration * 100).toFixed(1);
      const neutralAvgConfidence = emotionConfidences['중립'] 
        ? (emotionConfidences['중립'].reduce((a, b) => a + b, 0) / emotionConfidences['중립'].length * 100).toFixed(1)
        : '0.0';
      console.log(`주요 감정: 중립 (${neutralPercentage}%, 평균 신뢰도: ${neutralAvgConfidence}%)`);
    }
    console.log('==================');

    // 기록 초기화
    emotionHistory.current = [];
    lastRecordTime.current = 0;
  };

  useEffect(() => {
    if (videoRef.current && isRecording && modelsLoaded.current) {
      detectEmotion()
      
      // 녹화 시작 시 기록 초기화
      if (emotionHistory.current.length === 0) {
        emotionHistory.current = [];
        lastRecordTime.current = Date.now();
      }
    } else {
      // 녹화 중지 시에는 감정 분석을 실행하지 않음 (최종 완료 시에만 실행)
      setEmotion('중립')
      setConfidence(0)
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [videoRef.current, isRecording, modelsLoaded.current])

  return { emotion, confidence, analyzeEmotionHistory }
}



export function VoicePhotoReminiscenceSession({ onBack }: VoiceSessionProps) {
  const [currentPhoto, setCurrentPhoto] = useState(0)
  const [isAITalking, setIsAITalking] = useState(true)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { isRecording, audioLevel, recordedMedia, isAutoRecording, startRecording, stopRecording, resetRecording } = useVoiceRecording(webcamStream)
  const { emotion, confidence, analyzeEmotionHistory } = useEmotionDetection(videoRef, isRecording)

  const photos = [
    {
      src: "/placeholder.svg?height=400&width=600&text=1970년대+서울+명동거리",
      title: "1970년대 명동거리",
      question:
        "이 1970년대 명동거리 사진을 보시면서 떠오르는 기억을 말씀해 주세요.\n준비가 완료되면 대답답하기 버튼을 눌러 대답해주세요",
      era: "1970년대",
    },
    {
      src: "/placeholder.svg?height=400&width=600&text=1960년대+시장+풍경",
      title: "1960년대 전통시장",
      question:
        "이런 전통시장에서 장을 보신 기억이 있으신가요?\n준비가 완료되면 대답답하기 버튼을 눌러 대답해주세요",
      era: "1960년대",
    },
    {
      src: "/placeholder.svg?height=400&width=600&text=1980년대+가족+나들이",
      title: "1980년대 가족 나들이",
      question:
        "이런 가족 나들이를 하신 추억이 있으신가요?\n준비가 완료되면 대답하기 버튼을 눌러 대답해주세요",
      era: "1980년대",
    },
  ]

  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setProgress(((currentPhoto + 1) / photos.length) * 100)
    
    // 사진이 변경될 때마다 TTS 재생
    const playPhotoTTS = async () => {
      try {
        setIsAITalking(true)
        const audioContent = await synthesizeSpeech(photos[currentPhoto].question)
        await playAudio(audioContent)
      } catch (error) {
        console.error('TTS 에러:', error)
      } finally {
        setIsAITalking(false)
      }
    }
    
    playPhotoTTS()

    return () => {
      stopCurrentAudio()
    }
  }, [currentPhoto, photos.length])

  const handleNext = () => {
    if (currentPhoto < photos.length - 1) {
      if (isRecording) {
        stopRecording()
      }
      // 다음 사진으로 넘어갈 때 이전 녹화 상태 초기화
      resetRecording()
      setCurrentPhoto(currentPhoto + 1)
    } else {
      // 마지막 사진 완료 시 최종 감정 분석 실행
      console.log('=== 추억의 시대 훈련 최종 감정 분석 결과 ===')
      analyzeEmotionHistory()
      markRecallTrainingSessionAsCompleted('photo')
      setShowCompletionModal(true)
    }
  }

  const handleBackToMain = () => {
    stopCurrentAudio()
    onBack()
  }

  const replayQuestion = async () => {
    try {
      stopCurrentAudio()
      setIsAITalking(true)
      if (isRecording) {
        stopRecording()
      }
      const audioContent = await synthesizeSpeech(photos[currentPhoto].question)
      await playAudio(audioContent)
    } catch (error) {
      console.error('TTS 에러:', error)
    } finally {
      setIsAITalking(false)
    }
  }

  // 완료 모달
  if (showCompletionModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-white/95 backdrop-blur border-0 shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-4xl font-bold text-gray-800 mb-6">추억의 시대 완료!</h2>
            <p className="text-2xl text-gray-600 mb-10 font-medium">
              모든 사진을 성공적으로 완료하셨습니다.<br />
              다른 훈련 프로그램도 진행해보세요.
            </p>
            <div className="flex gap-6">
              <Button
                variant="outline"
                onClick={handleBackToMain}
                className="flex-1 h-16 text-xl font-bold px-8"
              >
                메인으로 돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-3 text-2xl font-bold hover:bg-white/50 bg-white/80 backdrop-blur px-6 py-4">
            <ArrowLeft className="w-7 h-7" />
            돌아가기
          </Button>
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-800 mb-2" style={{ fontFamily: "Paperlogy, sans-serif" }}>
              추억의 시대 훈련
            </h1>
            <p className="text-2xl text-gray-600 font-medium">사진과 함께 소중한 추억을 되살려보세요</p>
          </div>
          <div className="text-right">
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* 왼쪽: 사진과 질문 영역 */}
          <div className="lg:col-span-2">
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur overflow-hidden h-full">
              <CardContent className="p-8">
                {/* 사진 제목 */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-4 bg-purple-100 text-purple-700 px-6 py-3 rounded-full mb-6">
                    <Camera className="w-7 h-7" />
                    <span className="font-bold text-xl">
                      사진 {currentPhoto + 1}/{photos.length}
                    </span>
                  </div>
                  <h2 className="text-4xl font-bold text-gray-800 mb-4">{photos[currentPhoto].title}</h2>
                  <p className="text-2xl text-purple-600 font-medium">{photos[currentPhoto].era}</p>
                </div>

                {/* 사진 표시 */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-8 rounded-2xl mb-8">
                  <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center mb-6">
                    <img
                      src={photos[currentPhoto].src}
                      alt={photos[currentPhoto].title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-lg text-purple-600 font-bold">{photos[currentPhoto].era}</p>
                  </div>
                </div>

                {/* 질문 내용 */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-10 rounded-2xl mb-10">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-lg text-purple-600 font-bold mb-3">질문을 읽어주세요</p>
                      <p className="text-2xl leading-relaxed text-gray-800 whitespace-pre-line font-medium">
                        {photos[currentPhoto].question}
                      </p>
                    </div>
                  </div>
                </div>



                {/* 녹음 상태 */}
                {isRecording && (
                  <div className="mb-8">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-6 h-6 bg-red-500 rounded-full animate-pulse"></div>
                          <div>
                            <p className="font-bold text-red-800 text-xl">녹음 중...</p>
                            <p className="text-lg text-red-600">자유롭게 말씀해 주세요</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                      
                      {/* 오디오 레벨 표시 */}
                      <div className="mt-4">
                        <div className="flex items-center gap-1 h-8">
                          {Array.from({ length: 20 }, (_, i) => (
                            <div
                              key={i}
                              className="flex-1 bg-red-200 rounded-sm transition-all duration-100"
                              style={{
                                height: `${Math.max(10, (audioLevel / 255) * 100 * (i + 1) / 20)}%`,
                                backgroundColor: audioLevel > 50 ? '#ef4444' : '#fecaca'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 녹음된 미디어 재생 */}
                {recordedMedia && !isRecording && (
                  <div className="mb-8">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <CheckCircle className="w-8 h-8 text-green-600" />
                          <div>
                            <p className="font-bold text-green-800 text-xl">답변이 녹화되었습니다</p>
                            <p className="text-lg text-green-600">아래에서 다시 확인하실 수 있습니다</p>
                          </div>
                        </div>
                        <video controls src={recordedMedia} className="w-100 h-31 rounded-lg" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 컨트롤 버튼들 */}
                <div className="flex items-center justify-center gap-6">
                  <Button
                    onClick={replayQuestion}
                    variant="outline"
                    className="h-16 px-8 border-2 border-purple-400 text-purple-700 hover:bg-purple-50 bg-transparent text-xl font-bold"
                  >
                    <RotateCcw className="w-6 h-6 mr-3" />
                    다시재생
                  </Button>

                  <Button
                    onClick={isRecording ? stopRecording : () => startRecording(false)}
                    className={`h-16 px-12 text-xl font-bold ${
                      isRecording
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-6 h-6 mr-3" />
                        녹음 중지
                      </>
                    ) : (
                      <>
                        <Mic className="w-6 h-6 mr-3" />
                        대답하기
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleNext}
                    disabled={!recordedMedia}
                    className="h-16 px-12 bg-purple-600 hover:bg-purple-700 text-white text-xl font-bold"
                  >
                    {currentPhoto === photos.length - 1 ? '완료하기' : '다음 사진'}
                    <ArrowRight className="w-6 h-6 ml-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽: 사용자 캠 화면 */}
          <div className="lg:col-span-1">
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur overflow-hidden h-full">
              <CardContent className="p-6">
                                                  <WebcamView 
                   isRecording={isRecording}
                   onStreamReady={setWebcamStream}
                   videoRef={videoRef}
                 />
                 
                 {/* 감정 분석 결과 */}
                 <div className="bg-white/80 backdrop-blur rounded-lg p-6 mt-4">
                   <h3 className="text-2xl font-bold mb-4">감정 분석</h3>
                   <div className="space-y-4">
                     <div className="flex justify-between items-center">
                       <span className="text-lg font-medium">현재 감정:</span>
                       <span className="font-bold text-purple-600 text-xl">{emotion}</span>
                     </div>
                     <div className="flex justify-between items-center">
                       <span className="text-lg font-medium">신뢰도:</span>
                       <span className="font-bold text-purple-600 text-xl">{Math.round(confidence * 100)}%</span>
                     </div>
                     <div className="w-full bg-gray-200 rounded-full h-3">
                       <div
                         className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                         style={{ width: `${confidence * 100}%` }}
                       />
                     </div>
                   </div>
                 </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VoicePhotoReminiscenceSession