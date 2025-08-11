"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Camera, Square, Play, Download, AlertCircle, Video } from "lucide-react"

export default function CameraRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const recordedChunksRef = useRef<Blob[]>([])
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [fileExtension, setFileExtension] = useState("mp4")
  const [recordingStatus, setRecordingStatus] = useState<"idle" | "recording" | "stopped">("idle")

  const videoRef = useRef<HTMLVideoElement>(null)
  const recordedVideoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setIsStreaming(true)
    } catch (err) {
      setError("카메라 접근 권한이 필요합니다. 브라우저에서 카메라 권한을 허용해주세요.")
      console.error("Error accessing camera:", err)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsStreaming(false)
  }, [])

  const startRecording = useCallback(() => {
    if (!streamRef.current) return

    try {
      // 녹화 청크 초기화
      recordedChunksRef.current = []

      // 브라우저 지원 형식 확인 및 선택
      let mimeType = "video/webm;codecs=vp9"
      let fileExt = "webm"

      // 더 안정적인 형식 선택 로직
      const supportedTypes = [
        { type: "video/webm;codecs=vp9", ext: "webm" },
        { type: "video/webm;codecs=vp8", ext: "webm" },
        { type: "video/webm", ext: "webm" },
        { type: "video/mp4;codecs=h264", ext: "mp4" },
        { type: "video/mp4", ext: "mp4" },
      ]

      for (const format of supportedTypes) {
        if (MediaRecorder.isTypeSupported(format.type)) {
          mimeType = format.type
          fileExt = format.ext
          break
        }
      }

      console.log(`Using format: ${mimeType}`)

      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps
      })

      mediaRecorderRef.current = mediaRecorder
      setFileExtension(fileExt)

      mediaRecorder.ondataavailable = (event) => {
        console.log("Data available:", event.data.size)
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        console.log("Recording stopped, chunks:", recordedChunksRef.current.length)
        if (recordedChunksRef.current.length > 0) {
          const blob = new Blob(recordedChunksRef.current, { type: mimeType })
          const url = URL.createObjectURL(blob)
          setRecordedVideoUrl(url)
          setRecordingStatus("stopped")
          console.log("Video URL created:", url)
        } else {
          setError("녹화 데이터가 없습니다. 다시 시도해주세요.")
        }
      }

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event)
        setError("녹화 중 오류가 발생했습니다.")
        setIsRecording(false)
      }

      // 100ms마다 데이터 수집
      mediaRecorder.start(100)
      setIsRecording(true)
      setRecordingStatus("recording")
      setRecordingTime(0)

      // 녹화 시간 타이머 시작
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error("Recording start error:", err)
      const message = err instanceof Error ? err.message : String(err)
      setError(`녹화를 시작할 수 없습니다: ${message}`)
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isRecording])

  const downloadRecording = useCallback(() => {
    if (recordedVideoUrl) {
      const a = document.createElement("a")
      a.href = recordedVideoUrl
      a.download = `recording-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.${fileExtension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }, [recordedVideoUrl, fileExtension])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Video className="w-8 h-8 text-blue-600" />
            실시간 카메라 녹화
          </h1>
          <p className="text-gray-600">웹캠을 사용하여 실시간으로 화면을 보고 녹화할 수 있습니다</p>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* 실시간 카메라 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                실시간 카메라
                {isStreaming && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    라이브
                  </Badge>
                )}
                {isRecording && (
                  <Badge variant="destructive" className="animate-pulse">
                    녹화 중 {formatTime(recordingTime)}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>카메라를 시작하고 녹화를 진행하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              </div>

              <div className="flex gap-2">
                {!isStreaming ? (
                  <Button onClick={startCamera} className="flex-1">
                    <Camera className="w-4 h-4 mr-2" />
                    카메라 시작
                  </Button>
                ) : (
                  <>
                    {!isRecording ? (
                      <Button onClick={startRecording} className="flex-1" variant="destructive">
                        <Play className="w-4 h-4 mr-2" />
                        녹화 시작
                      </Button>
                    ) : (
                      <Button onClick={stopRecording} className="flex-1 bg-transparent" variant="outline">
                        <Square className="w-4 h-4 mr-2" />
                        녹화 중지
                      </Button>
                    )}
                    <Button onClick={stopCamera} variant="outline">
                      카메라 중지
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 녹화된 비디오 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                녹화된 비디오
              </CardTitle>
              <CardDescription>녹화가 완료되면 여기서 재생하고 다운로드할 수 있습니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                {recordedVideoUrl ? (
                  <video
                    ref={recordedVideoRef}
                    src={recordedVideoUrl}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>녹화된 비디오가 여기에 표시됩니다</p>
                  </div>
                )}
              </div>

              {recordedVideoUrl && (
                <Button onClick={downloadRecording} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  비디오 다운로드
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 디버깅 정보 */}
        {process.env.NODE_ENV === "development" && (
          <Card>
            <CardHeader>
              <CardTitle>디버깅 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <p>녹화 상태: {recordingStatus}</p>
                <p>파일 형식: {fileExtension}</p>
                <p>스트림 상태: {isStreaming ? "활성" : "비활성"}</p>
                <p>녹화된 청크: {recordedChunksRef.current.length}개</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 사용 안내 */}
        <Card>
          <CardHeader>
            <CardTitle>사용 방법</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">카메라 시작</h4>
                  <p className="text-gray-600">카메라 시작 버튼을 클릭하여 웹캠을 활성화하세요.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">녹화 시작</h4>
                  <p className="text-gray-600">녹화 시작 버튼을 클릭하여 비디오 녹화를 시작하세요.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1">다운로드</h4>
                  <p className="text-gray-600">녹화 완료 후 비디오를 재생하고 다운로드하세요.</p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">📹 녹화 형식 정보</h4>
              <p className="text-sm text-blue-800">
                브라우저가 MP4를 지원하는 경우 MP4 형식으로, 그렇지 않은 경우 WebM 형식으로 녹화됩니다. 대부분의 최신
                브라우저에서 MP4 형식을 지원합니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
