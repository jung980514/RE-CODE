"use client"

import { useState, useEffect, useRef } from "react"
import * as faceapi from '@vladmandic/face-api'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { WebcamView } from "@/components/common/WebcamView"
import {
  ArrowLeft,
  ArrowRight,
  Mic,
  MicOff,
  CheckCircle,
  Maximize,
  Music,
  RotateCcw,
  Play,
  Pause,
} from "lucide-react"
import { markRecallTrainingSessionAsCompleted } from "@/lib/auth"

interface VoiceSessionProps {
  onBack: () => void
}

// 비디오 녹화 훅
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

        // 말하기/표정 변화 감지 로직 개선
        const isSpeaking = emotionChange > 0.15
        const isSmiling = expressions.happy > 0.3
        const isNeutralDominant = expressions.neutral > 0.5
        
        // 슬픔 감정 보정을 위한 추가 체크
        const sadScore = expressions.sad
        const mouthOpenScore = Math.max(expressions.surprised, expressions.sad)
        const isMouthOpen = mouthOpenScore > 0.3
        
        // 실제 슬픔 표정인지 판단
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

function useVideoRecording(
  audioRef: React.RefObject<HTMLAudioElement | null>,
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>
) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startRecording = async () => {
    try {
      // 오디오 일시 정지
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: true 
      })
      streamRef.current = stream
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm'
      })
      mediaRecorderRef.current = mediaRecorder

      const chunks: BlobPart[] = []
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const videoUrl = URL.createObjectURL(blob)
        setRecordedVideo(videoUrl)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("비디오 녹화 오류:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }

  return {
    isRecording,
    recordedVideo,
    startRecording,
    stopRecording,
  }
}


export function VoiceMusicTherapySession({ onBack }: VoiceSessionProps) {
  const [currentSong, setCurrentSong] = useState(0)
  const [isAITalking, setIsAITalking] = useState(true)
  const [volume, setVolume] = useState(80)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const { isRecording, recordedVideo, startRecording, stopRecording } = useVideoRecording(audioRef, setIsPlaying)
  const { emotion, confidence } = useEmotionDetection(videoRef, isRecording)

  const songs = [
    {
      title: "인지자극훈련",
      artist: "소리",
      question: "이 소리를 들으시면서 떠오르는 기억이 있으신가요?\n언제 처음 들으셨는지, 누구와 함께 들으셨는지 말씀해 주세요. 준비가 완료되면 답변하기를 눌러 말씀해주세요",
      audioUrl: "/sound/test-sound.mp3"
    },
  ]

  const localname = localStorage.getItem("name")

  const setupAudio = () => {
    const audio = new Audio();
    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.onended = () => {
      setIsPlaying(false);
      setIsAITalking(false);
    };
    return audio;
  };

  const cleanupAudio = (audio: HTMLAudioElement) => {
    audio.onplay = null;
    audio.onpause = null;
    audio.onended = null;
    audio.pause();
    audio.src = '';
    audio.load();
  };

  const playAudio = async (audio: HTMLAudioElement, url: string) => {
    try {
      audio.src = url;
      audio.volume = volume / 100;
      
      await new Promise((resolve) => {
        const handleLoad = () => {
          audio.removeEventListener('loadeddata', handleLoad);
          resolve(true);
        };
        audio.addEventListener('loadeddata', handleLoad);
      });

      await audio.play();
    } catch (error) {
      console.error('오디오 재생 실패:', error);
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    let audio: HTMLAudioElement | null = null;

    const init = async () => {
      if (audioRef.current) {
        cleanupAudio(audioRef.current);
      }

      audio = setupAudio();
      audioRef.current = audio;
      await playAudio(audio, songs[currentSong].audioUrl);
    };

    init();

    return () => {
      if (audio) {
        cleanupAudio(audio);
      }
      audioRef.current = null;
    };
  }, [currentSong]);

  // 볼륨 변경 처리
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // AI 대화 타이머
  useEffect(() => {
    if (isAITalking) {
      const timer = setTimeout(() => {
        setIsAITalking(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [currentSong, isAITalking]);

  const handleNext = () => {
    // 현재 재생 중인 오디오 정지
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if (currentSong < songs.length - 1) {
      setCurrentSong(currentSong + 1)
      setIsAITalking(true)
      setIsPlaying(false)
      if (isRecording) {
        stopRecording()
      }
    } else {
      // 마지막 질문 완료 시
      markRecallTrainingSessionAsCompleted('music')
      setShowCompletionModal(true)
    }
  }

  const handleBackToMain = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
      audioRef.current.load();
      audioRef.current = null;
    }
    onBack();
  }

  const replayQuestion = async () => {
    setIsAITalking(true);
    
    // 녹화 중이면 중지
    if (isRecording) {
      stopRecording();
    }

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      await playAudio(audioRef.current, songs[currentSong].audioUrl);
    }
  }

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        const playAudio = async () => {
          try {
            await new Promise((resolve) => {
              if (audioRef.current) {
                audioRef.current.onloadeddata = resolve;
              }
            });
            if (audioRef.current) {
              await audioRef.current.play();
            }
          } catch (error) {
            console.error('재생 실패:', error);
          }
        };
        playAudio();
      }
    }
  }

  // 완료 모달
  if (showCompletionModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-white/95 backdrop-blur border-0 shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">들려오는 추억 완료!</h2>
            <p className="text-gray-600 mb-8">
              모든 음악을 성공적으로 완료하셨습니다.<br />
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 text-lg">
            <ArrowLeft className="w-5 h-5" />
            돌아가기
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">들려오는 추억 훈련</h1>
          </div>
          <div className="text-right">
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* 왼쪽: 음악과 질문 영역 */}
          <div className="lg:col-span-2">
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur overflow-hidden h-full">
              <CardContent className="p-8">
                {/* 음악 제목 */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-3 bg-green-100 text-green-700 px-4 py-2 rounded-full mb-4">
                    <Music className="w-5 h-5" />
                    <span className="font-medium">
                      노래 {currentSong + 1}/{songs.length}
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">{songs[currentSong].title}</h2>
                  <p className="text-lg text-green-600 font-medium">{songs[currentSong].artist}</p>
                </div>

                {/* 음악 플레이어 */}
                <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-2xl mb-6">
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                      <Music className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{songs[currentSong].title}</h3>
                      <p className="text-green-600">{songs[currentSong].artist}</p>
                    </div>
                    <Button
                      onClick={togglePlay}
                      className="w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full"
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </Button>
                  </div>
                </div>

                {/* 질문 내용 */}
                <div className="bg-gradient-to-r from-green-50 to-teal-50 p-8 rounded-2xl mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Music className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-green-600 font-medium mb-2">RE:CODE는 궁금해요</p>
                      <p className="text-xl leading-relaxed text-gray-800 whitespace-pre-line">
                        {songs[currentSong].question}
                      </p>
                    </div>
                  </div>
                </div>



                {/* 녹화 상태 */}
                {isRecording && (
                  <div className="mb-8">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                          <div>
                            <p className="font-medium text-red-800">녹화 중...</p>
                            <p className="text-sm text-red-600">자유롭게 말씀해 주세요</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 녹화된 비디오 재생 */}
                {recordedVideo && !isRecording && (
                  <div className="mb-8">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                          <div>
                            <p className="font-medium text-green-800">답변이 녹화되었습니다</p>
                            <p className="text-sm text-green-600">아래에서 다시 확인하실 수 있습니다</p>
                          </div>
                        </div>
                        <video 
                          controls 
                          src={recordedVideo} 
                          className="w-full rounded-lg"
                          style={{ maxHeight: '300px' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 컨트롤 버튼들 */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    onClick={replayQuestion}
                    variant="outline"
                    className="h-12 px-6 border-green-300 text-green-600 hover:bg-green-50 bg-transparent"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    다시재생
                  </Button>

                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`h-12 px-8 font-medium ${
                      isRecording
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-5 h-5 mr-2" />
                        녹화 중지
                      </>
                    ) : (
                      <>
                        <Mic className="w-5 h-5 mr-2" />
                        답변하기
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleNext}
                    disabled={!recordedVideo && !isRecording}
                    className="h-12 px-6 bg-green-500 hover:bg-green-600 text-white"
                  >
                    {currentSong === songs.length - 1 ? '완료하기' : '다음 노래'}
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
                <WebcamView 
                  userName={localname ?? "사용자"}
                  isRecording={isRecording}
                  videoRef={videoRef}
                />
                
                {/* 감정 분석 결과 */}
                <div className="bg-white/80 backdrop-blur rounded-lg p-4 mt-4">
                  <h3 className="text-lg font-semibold mb-2">감정 분석</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>현재 감정:</span>
                      <span className="font-medium text-green-600">{emotion}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>신뢰도:</span>
                      <span className="font-medium text-green-600">{Math.round(confidence * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 진행 단계 표시 */}
        <div className="mt-8 flex justify-center gap-4">
          {songs.map((_, index) => (
            <div
              key={index}
              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                index === currentSong
                  ? "bg-green-500 text-white shadow-lg scale-110"
                  : index < currentSong
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
              }`}
            >
              {index < currentSong ? <CheckCircle className="w-6 h-6" /> : index + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 