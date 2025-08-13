"use client"
import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { TrainingRecord, Question, KeyMoment, Video } from "@/app/calender/page"
import { Clock, PlayCircle, ChevronDown, ChevronUp, Play } from "lucide-react"

interface ReminiscenceModalProps {
  isOpen: boolean
  onClose: () => void
  record: TrainingRecord
}

export function ReminiscenceModal({ isOpen, onClose, record }: ReminiscenceModalProps) {
  const [expandedVideos, setExpandedVideos] = useState<Record<string, number>>({})

  if (!record) return null

  const formattedDate = new Date(record.date).toLocaleDateString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
  })

  const handleVideoClick = (questionId: string, videoIndex: number) => {
    setExpandedVideos(prev => ({
      ...prev,
      [questionId]: videoIndex
    }))
  }

  const getExpandedVideoIndex = (questionId: string) => {
    return expandedVideos[questionId] !== undefined ? expandedVideos[questionId] : 0
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] h-[90vh] flex flex-col p-0 bg-gray-100">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold text-gray-800">{formattedDate} 회상기록</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 grid gap-6">
            {/* Question Sections */}
            {record.questions.map((question: Question) => {
              const hasKeyMoments = question.keyMoments.length > 0
              const expandedVideoIndex = getExpandedVideoIndex(question.id)
              
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
                      점수 {question.emotionIntensity}
                    </div>
                  </div>
                  <p className="text-base text-gray-700 mb-4">{question.questionText}</p>

                  {/* Video Accordion */}
                  {hasKeyMoments && (
                    <div className="space-y-4">
                      {question.keyMoments.map((moment: KeyMoment, index: number) => (
                        <div key={`${question.id}-${index}`}>
                          {expandedVideoIndex === index ? (
                            /* Expanded Video - Iframe View */
                            <div className="bg-black rounded-lg overflow-hidden">
                              <div className="aspect-video relative">
                                <div className="w-full h-full bg-black flex items-center justify-center">
                                  <div className="text-center text-white">
                                    <PlayCircle className="h-16 w-16 mx-auto mb-3 text-white/80" />
                                    <span className="text-lg">영상 재생</span>
                                  </div>
                                </div>
                                <div className="absolute bottom-4 left-4 text-white text-sm font-medium">
                                  {moment.description}
                                </div>
                                <div className="absolute top-4 right-4 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-mono">
                                  {moment.timestamp}
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Collapsed Video - Card View */
                            <Card
                              className="cursor-pointer hover:bg-gray-100 transition-colors"
                              onClick={() => handleVideoClick(question.id, index)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-black rounded flex items-center justify-center">
                                    <Play className="w-5 h-5 text-white fill-white" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-blue-600 text-sm font-medium">{moment.timestamp}</span>
                                      <span className="text-gray-700 text-sm">{moment.description}</span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      ))}
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
