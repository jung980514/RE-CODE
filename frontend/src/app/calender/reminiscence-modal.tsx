"use client"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { TrainingRecord, Question, KeyMoment, Video } from "@/app/page"
import { Clock, PlayCircle } from "lucide-react"

interface ReminiscenceModalProps {
  isOpen: boolean
  onClose: () => void
  record: TrainingRecord
}

export function ReminiscenceModal({ isOpen, onClose, record }: ReminiscenceModalProps) {
  if (!record) return null

  const formattedDate = new Date(record.date).toLocaleDateString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] h-[90vh] flex flex-col p-0 bg-gray-100">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold text-gray-800">{formattedDate} 회상기록</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 grid gap-6">
            {/* Overall Emotion Analysis Section */}
            <Card className="bg-purple-50 border-none shadow-none p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl" aria-hidden="true">
                  {record.overallEmotionEmoji}
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">전체 감정 분석</h2>
                  <p className="text-sm text-gray-600">신뢰도: {record.overallConfidence}%</p>
                </div>
                <div className="ml-auto flex flex-col items-end gap-1">
                  {" "}
                  {/* Changed to flex-col */}
                  <span className="text-lg font-semibold text-purple-600">강도 {record.overallIntensity}/10</span>
                  <Progress
                    value={record.overallIntensity * 10}
                    className="w-24 h-2 bg-purple-200"
                    indicatorClassName="bg-purple-600"
                  />
                </div>
              </div>
              <div className="bg-white p-3 rounded-md text-sm text-gray-700 border border-purple-200">
                <span className="font-semibold text-gray-900">AI 인사이트</span>
                <p>{record.aiInsight}</p>
              </div>
            </Card>

            {/* Question Sections */}
            {record.questions.map((question: Question) => {
              return (
                <Card key={question.id} className="bg-white shadow-sm p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-800">{question.type}</h3>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {question.duration}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-base font-semibold text-gray-700">
                      <span className="text-2xl" aria-hidden="true">
                        {question.emotionEmoji}
                      </span>
                      강도 {question.emotionIntensity}
                    </div>
                  </div>
                  <p className="text-base text-gray-700 mb-4">{question.questionText}</p>

                  {/* Video List for each question */}
                  {question.videos.length > 0 && (
                    <div className="grid gap-4 mb-4">
                      {question.videos.map((video: Video) => (
                        <div
                          key={video.id}
                          className="relative w-full h-48 bg-black rounded-md flex items-center justify-center text-white text-lg overflow-hidden"
                        >
                          <Image
                            src={video.url || "/placeholder.svg"}
                            alt={`Video thumbnail for ${video.description}`}
                            layout="fill"
                            objectFit="cover"
                            className="opacity-50"
                          />
                          <div className="absolute z-10 flex flex-col items-center">
                            <PlayCircle className="h-12 w-12 text-white/80" />
                            <span>영상 재생</span>
                          </div>
                          <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                            {video.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {question.keyMoments.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-gray-800 mb-2">주요 순간들</h4>
                      <div className="grid gap-2">
                        {question.keyMoments.map((moment: KeyMoment, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 bg-blue-50/50 p-2 rounded-md">
                            <span className="font-mono text-sm text-blue-700">{moment.timestamp}</span>
                            <p className="text-sm text-gray-700">{moment.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
