"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Heart, Brain, Camera, BookOpen, Users, Settings, Play, Star, Clock, Award, HelpCircle, ChevronRight, CheckCircle, Info, Lightbulb, MessageCircle, Mic, Maximize, Volume2, Music } from 'lucide-react'

interface Program {
  id: string
  title: string
  subtitle: string
  description: string
  icon: string | React.ElementType
  image: string
  color: string
  bgColor: string
  duration: string
  level: string
  category: string
}

// 아이콘 매핑 객체
const iconMap: { [key: string]: React.ElementType } = {
  Brain,
  Heart,
  Camera,
  Music,
  BookOpen,
  Users,
  Settings,
  Play,
  Star,
  Clock,
  Award,
  HelpCircle,
  ChevronRight,
  CheckCircle,
  Info,
  Lightbulb,
  MessageCircle,
  Mic,
  Maximize,
  Volume2
}

interface HelpDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  programs: Program[]
}

export default function HelpDialog({ isOpen, onOpenChange, programs }: HelpDialogProps) {
  const getIconComponent = (icon: string | React.ElementType): React.ElementType => {
    if (typeof icon === 'string') {
      return iconMap[icon] || HelpCircle
    }
    return icon
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <HelpCircle className="w-7 h-7 text-blue-600" />
            기억의 정원 사용 도우미
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {/* 프로그램 소개 */}
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-blue-600" />
              프로그램 소개
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {programs.map((program, index) => {
                const IconComponent = getIconComponent(program.icon)
                return (
                  <div key={program.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`w-8 h-8 bg-gradient-to-r ${program.color} rounded-full flex items-center justify-center text-white text-sm font-bold`}
                      >
                        {index + 1}
                      </div>
                      <IconComponent className="w-5 h-5 text-gray-600" />
                      <h4 className="font-semibold text-gray-800">{program.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{program.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="bg-white px-2 py-1 rounded-full">{program.category}</span>
                      <span>{program.duration}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* 추천 훈련 순서 */}
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ChevronRight className="w-5 h-5 text-green-600" />
              추천 훈련 순서
            </h3>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">기억 꺼내기 (기초질문)</h4>
                    <p className="text-sm text-gray-600">일상적인 질문으로 자연스럽게 시작해보세요</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">이야기 나누기 (개인화질문)</h4>
                    <p className="text-sm text-gray-600">개인의 경험과 이야기를 자유롭게 나누어보세요</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">들려오는 추억 (인지자극질문)</h4>
                    <p className="text-sm text-gray-600">음악과 소리로 감각을 자극하며 기억을 되살려보세요</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    4
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">추억의 시대 (인지자극질문)</h4>
                    <p className="text-sm text-gray-600">그 시절 사회 모습을 통해 시대적 추억을 공유해보세요</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 팁:</strong> 순서대로 진행하시면 더욱 효과적이지만, 원하는 프로그램부터 시작하셔도
                  괜찮습니다!
                </p>
              </div>
            </div>
          </section>

          {/* 기능 설명 */}
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-purple-600" />
              주요 기능 설명
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <Play className="w-4 h-4 text-green-600" />
                    시작하기 버튼
                  </h4>
                  <p className="text-sm text-gray-600">
                    선택한 프로그램을 바로 시작할 수 있습니다. 로그인이 필요합니다.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    훈련 시간
                  </h4>
                  <p className="text-sm text-gray-600">
                    모든 프로그램은 10분으로 구성되어 부담 없이 참여할 수 있습니다.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <Award className="w-4 h-4 text-orange-600" />
                    난이도 표시
                  </h4>
                  <p className="text-sm text-gray-600">
                    기초질문, 개인화질문, 인지자극질문으로 난이도가 구분됩니다.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-600" />
                    프로그램 선택
                  </h4>
                  <p className="text-sm text-gray-600">
                    카드를 클릭하여 프로그램을 선택하고 하단 버튼으로 시작할 수 있습니다.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-gray-600" />
                    설정 메뉴
                  </h4>
                  <p className="text-sm text-gray-600">우상단 설정 버튼으로 개인 설정을 변경할 수 있습니다.</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    함께하기
                  </h4>
                  <p className="text-sm text-gray-600">
                    가족이나 친구들과 함께 참여하여 더욱 즐거운 시간을 보낼 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 훈련 화면 기능 설명 */}
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Play className="w-5 h-5 text-red-600" />
              훈련 화면 기능 가이드
            </h3>
            <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-lg">
              <p className="text-sm text-gray-700 mb-4">
                <strong>💡 훈련을 시작하면 나타나는 화면의 모든 기능을 설명드립니다</strong>
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {/* 왼쪽 컬럼 - 주요 버튼들 */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 border-b pb-2">🎛️ 주요 조작 버튼</h4>

                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <Mic className="w-4 h-4 text-white" />
                      </div>
                      <h5 className="font-semibold text-gray-800">녹음 버튼 (가장 중요!)</h5>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      • <strong>초록색일 때</strong>: 클릭하면 녹음 시작
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      • <strong>빨간색일 때</strong>: 녹음 중, 클릭하면 녹음 중지
                    </p>
                    <p className="text-xs text-blue-600">💡 편안하게 말씀하시면 AI가 듣고 있어요!</p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <ChevronRight className="w-4 h-4 text-white" />
                      </div>
                      <h5 className="font-semibold text-gray-800">다음 버튼</h5>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">• 현재 질문을 마치고 다음 질문으로 넘어갑니다</p>
                    <p className="text-xs text-blue-600">💡 답변을 다 하신 후에 눌러주세요</p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                        <Volume2 className="w-4 h-4 text-white" />
                      </div>
                      <h5 className="font-semibold text-gray-800">음량 조절</h5>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">• AI 음성의 크기를 조절할 수 있습니다</p>
                    <p className="text-xs text-blue-600">💡 듣기 편한 크기로 맞춰주세요</p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                        <Maximize className="w-4 h-4 text-white" />
                      </div>
                      <h5 className="font-semibold text-gray-800">전체화면</h5>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">• 화면을 크게 보고 싶을 때 사용하세요</p>
                    <p className="text-xs text-blue-600">💡 더 집중해서 훈련할 수 있어요</p>
                  </div>
                </div>

                {/* 오른쪽 컬럼 - 화면 요소들 */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 border-b pb-2">📺 화면 구성 요소</h4>

                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                      <h5 className="font-semibold text-gray-800">AI 상담사 화면</h5>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">• 중앙의 큰 화면에서 AI 상담사가 질문합니다</p>
                    <p className="text-xs text-blue-600">💡 마치 실제 상담사와 대화하는 느낌이에요</p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      </div>
                      <h5 className="font-semibold text-gray-800">녹음 상태 표시</h5>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      • <strong>"REC"</strong> 표시: 현재 녹음 중
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      • <strong>파형 애니메이션</strong>: AI가 말하거나 듣고 있을 때
                    </p>
                    <p className="text-xs text-blue-600">💡 상태를 한눈에 확인할 수 있어요</p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <h5 className="font-semibold text-gray-800">진행 상황</h5>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">• 상단 진행률 바: 전체 진행 정도</p>
                    <p className="text-sm text-gray-600 mb-1">• 하단 단계 표시: 현재 몇 번째 질문인지</p>
                    <p className="text-xs text-blue-600">💡 얼마나 진행됐는지 알 수 있어요</p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                        <Play className="w-4 h-4 text-white" />
                      </div>
                      <h5 className="font-semibold text-gray-800">녹음 재생</h5>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">• 방금 녹음한 내용을 다시 들을 수 있습니다</p>
                    <p className="text-xs text-blue-600">💡 내가 뭐라고 말했는지 확인해보세요</p>
                  </div>
                </div>
              </div>

              {/* 훈련 진행 순서 */}
              <div className="mt-6 bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  훈련 진행 순서
                </h4>
                <div className="grid md:grid-cols-4 gap-3 text-center">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto mb-2">
                      1
                    </div>
                    <p className="text-xs font-medium text-gray-800">AI 질문 듣기</p>
                    <p className="text-xs text-gray-600">편안하게 들어보세요</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto mb-2">
                      2
                    </div>
                    <p className="text-xs font-medium text-gray-800">녹음 버튼 클릭</p>
                    <p className="text-xs text-gray-600">초록 버튼을 눌러주세요</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto mb-2">
                      3
                    </div>
                    <p className="text-xs font-medium text-gray-800">자유롭게 답변</p>
                    <p className="text-xs text-gray-600">생각나는 대로 말해주세요</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto mb-2">
                      4
                    </div>
                    <p className="text-xs font-medium text-gray-800">다음으로 이동</p>
                    <p className="text-xs text-gray-600">다음 버튼을 눌러주세요</p>
                  </div>
                </div>
              </div>

              {/* 훈련 중 주의사항 */}
              <div className="mt-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-600" />
                  훈련 중 꿀팁
                </h4>
                <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-700">
                  <div>
                    <p className="mb-1">
                      ✅ <strong>이렇게 하세요</strong>
                    </p>
                    <ul className="text-xs space-y-1 ml-4">
                      <li>• 편안한 자세로 앉아서 진행하세요</li>
                      <li>• 생각나는 대로 자유롭게 말하세요</li>
                      <li>• 틀려도 괜찮으니 부담갖지 마세요</li>
                      <li>• 중간에 쉬고 싶으면 언제든 멈추세요</li>
                    </ul>
                  </div>
                  <div>
                    <p className="mb-1">
                      ❌ <strong>이런 건 피하세요</strong>
                    </p>
                    <ul className="text-xs space-y-1 ml-4">
                      <li>• 정답을 맞춰야 한다고 생각하지 마세요</li>
                      <li>• 너무 빨리 진행하려고 하지 마세요</li>
                      <li>• 기억이 안 나도 스트레스 받지 마세요</li>
                      <li>• 혼자서만 하려고 하지 마세요</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 사용 팁 */}
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              사용 팁
            </h3>
            <div className="bg-yellow-50 p-6 rounded-lg">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">🎯 효과적인 훈련을 위해</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 편안한 환경에서 진행하세요</li>
                    <li>• 무리하지 말고 천천히 참여하세요</li>
                    <li>• 정답이 없으니 자유롭게 표현하세요</li>
                    <li>• 매일 조금씩 꾸준히 해보세요</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">💡 더 나은 경험을 위해</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 가족과 함께 참여해보세요</li>
                    <li>• 기록하기 기능으로 추억을 남겨보세요</li>
                    <li>• 되돌아보기로 과거 활동을 확인하세요</li>
                    <li>• 모임 기능으로 다른 분들과 소통하세요</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* 자주 묻는 질문 */}
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              자주 묻는 질문
            </h3>
            <div className="space-y-3">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2">Q. 프로그램을 꼭 순서대로 해야 하나요?</h4>
                <p className="text-sm text-gray-600">
                  A. 순서대로 하시면 더 효과적이지만, 원하는 프로그램부터 시작하셔도 괜찮습니다. 본인의 관심사와
                  컨디션에 맞춰 선택하세요.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2">Q. 하루에 몇 개의 프로그램을 해도 되나요?</h4>
                <p className="text-sm text-gray-600">
                  A. 각 프로그램이 10분이므로 하루에 1-2개 정도가 적당합니다. 무리하지 마시고 편안하게 참여하세요.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2">Q. 정답을 맞춰야 하나요?</h4>
                <p className="text-sm text-gray-600">
                  A. 정답이 없습니다! 자유롭게 생각나는 것들을 표현하시면 됩니다. 기억을 되살리고 감정을 나누는 것이
                  목적입니다.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2">Q. 가족과 함께 할 수 있나요?</h4>
                <p className="text-sm text-gray-600">
                  A. 네! 가족이나 친구들과 함께 참여하시면 더욱 즐겁고 의미 있는 시간을 보낼 수 있습니다.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2">Q. 녹음 버튼을 눌렀는데 소리가 안 들려요</h4>
                <p className="text-sm text-gray-600">
                  A. 브라우저에서 마이크 권한을 허용해주세요. 화면 상단에 마이크 허용 알림이 나타나면 '허용'을
                  클릭하세요.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2">Q. AI 음성이 너무 빠르거나 느려요</h4>
                <p className="text-sm text-gray-600">
                  A. 음량 조절 버튼 옆에 있는 설정에서 속도를 조절할 수 있습니다. 또는 '다시재생' 버튼으로 다시
                  들어보세요.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2">Q. 중간에 그만두고 싶어요</h4>
                <p className="text-sm text-gray-600">
                  A. 언제든지 '돌아가기' 버튼을 눌러서 메인 화면으로 돌아갈 수 있습니다. 진행 상황은 자동으로
                  저장됩니다.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2">Q. 내 목소리가 제대로 녹음되고 있나요?</h4>
                <p className="text-sm text-gray-600">
                  A. 녹음 중일 때 화면에 파형이 움직이면 정상적으로 녹음되고 있는 것입니다. 녹음 후 재생 버튼으로
                  확인해보세요.
                </p>
              </div>
            </div>
          </section>

          {/* 연락처 */}
          <section className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-2">더 궁금한 것이 있으시다면?</h3>
            <p className="text-gray-600 mb-4">언제든지 문의해 주세요. 친절하게 도와드리겠습니다.</p>
            <div className="flex items-center justify-center gap-4">
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                <MessageCircle className="w-4 h-4 mr-2" />
                문의하기
              </Button>
              <Button variant="outline">
                <HelpCircle className="w-4 h-4 mr-2" />더 많은 도움말
              </Button>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
