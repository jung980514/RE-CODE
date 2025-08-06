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
  BookOpen,
  RotateCcw,
} from "lucide-react"
import { markRecallTrainingSessionAsCompleted } from "@/lib/auth"

interface VoiceSessionProps {
  onBack: () => void
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
    const totalDuration = (emotions[emotions.length - 1].timestamp - emotions[0].timestamp) / 1000;

    const emotionDurations: { [key: string]: number } = {};
    const emotionConfidences: { [key: string]: number[] } = {};

    emotions.forEach((record, index) => {
      const duration = index === emotions.length - 1
        ? 1
        : (emotions[index + 1].timestamp - record.timestamp) / 1000;

      emotionDurations[record.emotion] = (emotionDurations[record.emotion] || 0) + duration;
      emotionConfidences[record.emotion] = emotionConfidences[record.emotion] || [];
      emotionConfidences[record.emotion].push(record.confidence);
    });

    console.log('=== 감정 분석 결과 ===');
    console.log(`총 녹화 시간: ${totalDuration.toFixed(1)}초`);
    Object.entries(emotionDurations).forEach(([emotion, duration]) => {
      const percentage = (duration / totalDuration * 100).toFixed(1);
      const avgConfidence = (emotionConfidences[emotion].reduce((a, b) => a + b, 0) / emotionConfidences[emotion].length * 100).toFixed(1);
      console.log(`${emotion}: ${percentage}% (${duration.toFixed(1)}초, 평균 신뢰도: ${avgConfidence}%)`);
    });
    console.log('==================');

    emotionHistory.current = [];
    lastRecordTime.current = 0;
  };

  useEffect(() => {
    if (videoRef.current && isRecording && modelsLoaded.current) {
      detectEmotion()
      
      if (emotionHistory.current.length === 0) {
        emotionHistory.current = [];
        lastRecordTime.current = Date.now();
      }
    } else {
      if (!isRecording && emotionHistory.current.length > 0) {
        analyzeEmotionHistory();
      }

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

  return { emotion, confidence }
}

// 비디오 녹화 훅
function useVideoRecording(videoStream: MediaStream | null) {
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
        audioContextRef.current.close()
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
  }
}

export function VoiceStoryTellingSession({ onBack }: VoiceSessionProps) {
  const [currentTopic, setCurrentTopic] = useState(0)
  const [isAITalking, setIsAITalking] = useState(true)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { isRecording, audioLevel, recordedMedia, isAutoRecording, startRecording, stopRecording } = useVideoRecording(webcamStream)
  const { emotion, confidence } = useEmotionDetection(videoRef, isRecording)

  const topics = [
    {
      title: "개인화 질문",
      question: "인생에서 가장 행복했던 순간은 언제였나요?\n그때의 기분과 주변 사람들에 대해 말씀해 주세요. 준비가 완료되면 답변하기를 눌러 시작해주세요",
      icon: "🌟",
    },
  ]

  useEffect(() => {
    replayQuestion()

    // 컴포넌트가 언마운트될 때 TTS 정지
    return () => {
      stopCurrentAudio()
    }
  }, [currentTopic])

  const handleNext = () => {
    if (currentTopic < topics.length - 1) {
      setCurrentTopic(currentTopic + 1)
      setIsAITalking(true)
      if (isRecording) {
        stopRecording()
      }
    } else {
      // 마지막 질문 완료 시
      markRecallTrainingSessionAsCompleted('story')
      setShowCompletionModal(true)
    }
  }

  const handleBackToMain = () => {
    onBack()
  }

  const replayQuestion = async () => {
    try {
      // 기존 TTS 정지
      stopCurrentAudio()
      setIsAITalking(true)
      if (isRecording) {
        stopRecording()
      }
      const audioContent = await synthesizeSpeech(topics[currentTopic].question)
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-white/95 backdrop-blur border-0 shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">이야기 나누기 완료!</h2>
            <p className="text-gray-600 mb-8">
              모든 주제를 성공적으로 완료하셨습니다.<br />
              다른 훈련 프로그램도 진행해보세요.
            </p>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={handleBackToMain}
                className="flex-1"
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 text-lg">
            <ArrowLeft className="w-5 h-5" />
            돌아가기
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">개인화 훈련</h1>
          </div>
          <div className="text-right">
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* 왼쪽: 주제와 질문 영역 */}
          <div className="lg:col-span-2">
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur overflow-hidden h-full">
              <CardContent className="p-8">
                {/* 주제 제목 */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-3 bg-orange-100 text-orange-700 px-4 py-2 rounded-full mb-4">
                    <BookOpen className="w-5 h-5" />
                    <span className="font-medium">
                      주제 {currentTopic + 1}/{topics.length}
                    </span>
                  </div>
                  <div className="text-6xl mb-4">{topics[currentTopic].icon}</div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">{topics[currentTopic].title}</h2>
                </div>

                {/* 질문 내용 */}
                <div className="bg-gradient-to-r from-orange-50 to-red-50 p-8 rounded-2xl mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-orange-600 font-medium mb-2">질문을 읽어주세요</p>
                      <p className="text-xl leading-relaxed text-gray-800 whitespace-pre-line">
                        {topics[currentTopic].question}
                      </p>
                    </div>
                  </div>
                </div>
                {/* 녹음 상태 */}
                {isRecording && (
                  <div className="mb-8">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                          <div>
                            <p className="font-medium text-red-800">녹음 중...</p>
                            <p className="text-sm text-red-600">자유롭게 말씀해 주세요</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
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

                {/* 녹화된 미디어 재생 */}
                {recordedMedia && !isRecording && (
                  <div className="mb-8">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                          <div>
                            <p className="font-medium text-green-800">답변이 녹화되었습니다</p>
                            <p className="text-sm text-green-600">아래에서 다시 확인하실 수 있습니다</p>
                          </div>
                        </div>
                        <video controls src={recordedMedia} className="w-100 h-31 rounded-lg" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 컨트롤 버튼들 */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    onClick={replayQuestion}
                    variant="outline"
                    className="h-12 px-6 border-orange-300 text-orange-600 hover:bg-orange-50 bg-transparent"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    다시재생
                  </Button>

                  <Button
                    onClick={isRecording ? stopRecording : () => startRecording(false)}
                    className={`h-12 px-8 font-medium ${
                      isRecording
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-5 h-5 mr-2" />
                        녹음 중지
                      </>
                    ) : (
                      <>
                        <Mic className="w-5 h-5 mr-2" />
                        수동 녹음
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleNext}
                    disabled={!recordedMedia && !isRecording}
                    className="h-12 px-6 bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {currentTopic === topics.length - 1 ? '완료하기' : '다음 주제'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽: 사용자 캠 화면 */}
          <div className="lg:col-span-1">
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur overflow-hidden h-full">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <WebcamView 
                    isRecording={isRecording}
                    onStreamReady={setWebcamStream}
                    videoRef={videoRef}
                  />
                  
                  {/* 감정 분석 결과 */}
                  <div className="bg-white/80 backdrop-blur rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2">감정 분석</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>현재 감정:</span>
                        <span className="font-medium text-orange-600">{emotion}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>신뢰도:</span>
                        <span className="font-medium text-orange-600">{Math.round(confidence * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${confidence * 100}%` }}
                        />
                      </div>
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