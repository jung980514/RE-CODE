"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import {
  HelpCircle,
  Star,
  ChevronRight,
  CheckCircle,
  Info,
  Lightbulb,
  MessageCircle,
  Play,
  Clock,
  Award,
  Settings,
  Users,
  Heart,
  Brain,
  Camera,
  BookOpen,
  Volume2,
  Mic,
  Maximize,
} from "lucide-react"

interface HelpModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type TabType = "intro" | "order" | "features" | "guide" | "process" | "tips" | "faq"

export default function HelpModal({ open, onOpenChange }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("intro")

  const tabs = [
    { id: "intro" as TabType, label: "프로그램소개", icon: Star },
    { id: "order" as TabType, label: "추천훈련순서", icon: ChevronRight },
    { id: "features" as TabType, label: "주요기능설명", icon: Info },
    { id: "guide" as TabType, label: "훈련화면기능가이드", icon: Play },
    { id: "process" as TabType, label: "훈련진행순서", icon: CheckCircle },
    { id: "tips" as TabType, label: "사용팁", icon: Lightbulb },
    { id: "faq" as TabType, label: "자주묻는질문", icon: MessageCircle },
  ]

  const programs = [
    {
      id: "memory-training",
      title: "기초 질문",
      description: "일상적인 기본 질문들을 통해 자연스럽게 기억을 되살려보는 프로그램입니다.",
      icon: Brain,
      color: "from-blue-500 to-cyan-500",
      category: "기초질문",
      duration: "15분",
    },
    {
      id: "story-telling",
      title: "회상 질문",
      description: "개인의 경험과 관심사를 바탕으로 한 맞춤형 대화를 통해 기억력을 향상시킵니다.",
      icon: BookOpen,
      color: "from-orange-500 to-red-500",
      category: "개인화질문",
      duration: "15분",
    },
    {
      id: "music-therapy",
      title: "들려오는 추억",
      description: "음악과 다양한 일상소리를 통해 인지 능력을 자극하고 추억을 되살리는 프로그램입니다.",
      icon: Volume2,
      color: "from-green-500 to-emerald-500",
      category: "인지자극질문",
      duration: "15분",
    },
    {
      id: "photo-reminiscence",
      title: "추억의 시대",
      description:
        "1960-1980년대 한국의 사회적 이슈와 시대상을 담은 사진들로 그 시절 추억을 되살려보는 프로그램입니다.",
      icon: Camera,
      color: "from-purple-500 to-pink-500",
      category: "인지자극질문",
      duration: "15분",
    },
  ]

  const renderProgramIntro = () => (
    <section>
      <div className="grid md:grid-cols-2 gap-8">
        {programs.map((program, index) => {
          const IconComponent = program.icon
          return (
            <div key={program.id} className="bg-gray-50 p-8 rounded-xl">
              <div className="flex items-center gap-5 mb-6">
                <div
                  className={`w-14 h-14 bg-gradient-to-r ${program.color} rounded-full flex items-center justify-center text-white text-2xl font-bold`}
                  style={{ fontFamily: 'Paperlogy, sans-serif' }}
                >
                  {index + 1}
                </div>
                <IconComponent className="w-10 h-10 text-gray-600" />
                <h4 className="font-bold text-3xl text-gray-800" style={{ fontFamily: 'Paperlogy, sans-serif' }}>{program.title}</h4>
              </div>
              <p className="text-3xl text-gray-700 mb-6 leading-relaxed" style={{ fontFamily: 'Paperlogy, sans-serif' }}>{program.description}</p>
              <div className="flex items-center gap-8 text-lg text-gray-600">
                <span className="bg-white px-5 py-3 rounded-full font-medium text-lg" style={{ fontFamily: 'Paperlogy, sans-serif' }}>{program.category}</span>
                <span className="font-medium text-lg" style={{ fontFamily: 'Paperlogy, sans-serif' }}>{program.duration}</span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )

  const renderTrainingOrder = () => (
    <section>
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-xl">
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl" style={{ fontFamily: 'Paperlogy, sans-serif' }}>
              1
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-xl text-gray-800 mb-2" style={{ fontFamily: 'Paperlogy, sans-serif' }}>기초질문</h4>
              <p className="text-2xl text-gray-700" style={{ fontFamily: 'Paperlogy, sans-serif' }}>일상적인 질문으로 자연스럽게 시작해보세요</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <div className="flex items-center gap-6"> 
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl" style={{ fontFamily: 'Paperlogy, sans-serif' }}>
              2
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-xl text-gray-800 mb-2" style={{ fontFamily: 'Paperlogy, sans-serif' }}>개인화질문</h4>
              <p className="text-2xl text-gray-700" style={{ fontFamily: 'Paperlogy, sans-serif' }}>개인의 경험과 이야기를 자유롭게 나누어보세요</p>
            </div>
            <ChevronRight className="w-8 h-8 text-gray-400" />
          </div>
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl" style={{ fontFamily: 'Paperlogy, sans-serif' }}>
              3
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-xl text-gray-800 mb-2" style={{ fontFamily: 'Paperlogy, sans-serif' }}>들려오는 추억 (인지자극질문)</h4>
              <p className="text-2xl text-gray-700" style={{ fontFamily: 'Paperlogy, sans-serif' }}>음악과 소리로 감각을 자극하며 기억을 되살려보세요</p>
            </div>
            <ChevronRight className="w-8 h-8 text-gray-400" />
          </div>
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl" style={{ fontFamily: 'Paperlogy, sans-serif' }}>
              4
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-xl text-gray-800 mb-2" style={{ fontFamily: 'Paperlogy, sans-serif' }}>추억의 시대 (인지자극질문)</h4>
              <p className="text-2xl text-gray-700" style={{ fontFamily: 'Paperlogy, sans-serif' }}>그 시절 사회 모습을 통해 시대적 추억을 공유해보세요</p>
            </div>
            <ChevronRight className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="mt-6 p-6 bg-blue-100 rounded-xl">
          <p className="text-xl text-blue-800 leading-relaxed" style={{ fontFamily: 'Paperlogy, sans-serif' }}>
            <strong>💡 팁:</strong> 순서대로 진행하시면 더욱 효과적이지만, 원하는 프로그램부터 시작하셔도 괜찮습니다!
          </p>
        </div>
      </div>
    </section>
  )

  const renderFeatures = () => (
    <section>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 h-[120px] flex flex-col">
            <h4 className="font-bold text-xl text-gray-800 mb-3 flex items-center gap-3" style={{ fontFamily: 'Paperlogy, sans-serif' }}>
              <Play className="w-6 h-6 text-green-600" />
              시작하기 버튼
            </h4>
            <p className="text-2xl text-gray-700 leading-relaxed flex-1" style={{ fontFamily: 'Paperlogy, sans-serif' }}>선택한 프로그램을 바로 시작할 수 있습니다. 로그인이 필요합니다.</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 h-[120px] flex flex-col">
            <h4 className="font-bold text-xl text-gray-800 mb-3 flex items-center gap-3" style={{ fontFamily: 'Paperlogy, sans-serif' }}>
              <Clock className="w-6 h-6 text-blue-600" />
              훈련 시간
            </h4>
            <p className="text-2xl text-gray-700 leading-relaxed flex-1" style={{ fontFamily: 'Paperlogy, sans-serif' }}>모든 프로그램은 15분으로 구성되어 부담 없이 참여할 수 있습니다.</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 h-[120px] flex flex-col">
            <h4 className="font-bold text-xl text-gray-800 mb-3 flex items-center gap-3" style={{ fontFamily: 'Paperlogy, sans-serif' }}>
              <Heart className="w-6 h-6 text-red-600" />
              프로그램 선택
            </h4>
            <p className="text-2xl text-gray-700 leading-relaxed flex-1" style={{ fontFamily: 'Paperlogy, sans-serif' }}>
              카드를 클릭하여 프로그램을 선택하고 하단 버튼으로 시작할 수 있습니다.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 h-[120px] flex flex-col">
            <h4 className="font-bold text-xl text-gray-800 mb-3 flex items-center gap-3" style={{ fontFamily: 'Paperlogy, sans-serif' }}>
              <Settings className="w-6 h-6 text-gray-600" />
              마이페이지
            </h4>
            <p className="text-2xl text-gray-700 leading-relaxed flex-1" style={{ fontFamily: 'Paperlogy, sans-serif' }}>상단 마이페이지 버튼으로 개인 설정을 변경할 수 있습니다.</p>
          </div>
          
        </div>
      </div>
    </section>
  )

  const renderTrainingGuide = () => (
    <section>
              <div className="bg-gradient-to-r from-red-50 to-orange-50 p-8 rounded-xl">
          <p className="text-xl text-gray-700 mb-6 leading-relaxed" style={{ fontFamily: 'Paperlogy, sans-serif' }}>
            <strong>💡 훈련을 시작하면 나타나는 화면의 모든 기능을 설명드립니다</strong>
          </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* 왼쪽 컬럼 - 주요 버튼들 */}
          <div className="space-y-4">
            <h4 className="font-bold text-2xl text-gray-800 border-b-2 pb-3 mb-4" style={{ fontFamily: 'Paperlogy, sans-serif' }}>🎛️ 주요 조작 버튼</h4>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <Mic className="w-5 h-5 text-white" />
                </div>
                <h5 className="font-bold text-xl text-gray-800" style={{ fontFamily: 'Paperlogy, sans-serif' }}>녹음 버튼 (가장 중요!)</h5>
              </div>
              <p className="text-2xl text-gray-700 mb-3" style={{ fontFamily: 'Paperlogy, sans-serif' }}>
                • <strong>초록색일 때</strong>: 클릭하면 녹음 시작
              </p>
              <p className="text-2xl text-gray-700 mb-3" style={{ fontFamily: 'Paperlogy, sans-serif' }}>
                • <strong>빨간색일 때</strong>: 녹음 중, 클릭하면 녹음 중지
              </p>
              <p className="text-base text-blue-600" style={{ fontFamily: 'Paperlogy, sans-serif' }}>💡 편안하게 말씀하시면 AI가 듣고 있어요!</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <ChevronRight className="w-5 h-5 text-white" />
                </div>
                <h5 className="font-bold text-xl text-gray-800" style={{ fontFamily: 'Paperlogy, sans-serif' }}>다음 버튼</h5>
              </div>
              <p className="text-2xl text-gray-700 mb-3" style={{ fontFamily: 'Paperlogy, sans-serif' }}>• 현재 질문을 마치고 다음 질문으로 넘어갑니다</p>
              <p className="text-2xl text-gray-700 mb-3" style={{ fontFamily: 'Paperlogy, sans-serif' }}>• 편안하게 말씀하신후 넘어가세요</p>
              <p className="text-base text-blue-600" style={{ fontFamily: 'Paperlogy, sans-serif' }}>💡 답변을 다 하신 후에 눌러주세요</p>
            </div>
          </div>

          {/* 오른쪽 컬럼 - 화면 요소들 */}
          <div className="space-y-4">
            <h4 className="font-bold text-2xl text-gray-800 border-b-2 pb-3 mb-4" style={{ fontFamily: 'Paperlogy, sans-serif' }}>📺 화면 구성 요소</h4>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <h5 className="font-bold text-xl text-gray-800" style={{ fontFamily: 'Paperlogy, sans-serif' }}> 캐릭터 화면 </h5>
              </div>
              <p className="text-2xl text-gray-700 mb-3" style={{ fontFamily: 'Paperlogy, sans-serif' }}>• 중앙의 큰 화면에서 캐릭터가 질문합니다</p>
              <p className="text-2xl text-gray-700 mb-3" style={{ fontFamily: 'Paperlogy, sans-serif' }}>• 편안하게 말씀하셔도 됩니다</p>
              <p className="text-base text-blue-600" style={{ fontFamily: 'Paperlogy, sans-serif' }}>💡 마치 실제 상담사와 대화하는 느낌이에요</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                </div>
                <h5 className="font-bold text-xl text-gray-800" style={{ fontFamily: 'Paperlogy, sans-serif' }}>녹음 상태 표시</h5>
              </div>
              <p className="text-2xl text-gray-700 mb-3" style={{ fontFamily: 'Paperlogy, sans-serif' }}>
                • <strong>REC</strong> 표시: 현재 녹음 중
              </p>
              <p className="text-2xl text-gray-700 mb-3" style={{ fontFamily: 'Paperlogy, sans-serif' }}>
                • <strong>파형 애니메이션</strong>: AI가 말하거나 듣고 있을 때
              </p>
              <p className="text-base text-blue-600" style={{ fontFamily: 'Paperlogy, sans-serif' }}>💡 상태를 한눈에 확인할 수 있어요</p>
            </div>

          </div>
        </div>

        {/* 훈련 중 주의사항 */}
        <div className="mt-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-600" />
            훈련 중 꿀팁
          </h4>
          <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-700">
            <div>
              <p className="mb-1 text-xl">
                ✅ <strong>이렇게 하세요</strong>
              </p>
              <ul className="text-xl space-y-1 ml-4">
                <li>• 편안한 자세로 앉아서 진행하세요</li>
                <li>• 생각나는 대로 자유롭게 말하세요</li>
                <li>• 틀려도 괜찮으니 부담갖지 마세요</li>
                <li>• 중간에 쉬고 싶으면 언제든 멈추세요</li>
              </ul>
            </div>
            <div>
              <p className="mb-1 text-xl">
                ❌ <strong>이런 건 피하세요</strong>
              </p>
              <ul className="text-xl space-y-1 ml-4">
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
  )

  const renderTrainingProcess = () => (
    <section>
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid md:grid-cols-4 gap-3 text-center">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto mb-2">
              1
            </div>
            <p className="text-2xl font-medium text-gray-800">AI 질문 듣기</p>
            <p className="text-2xl text-gray-600">편안하게 들어보세요</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto mb-2">
              2
            </div>
            <p className="text-2xl font-medium text-gray-800">녹음 버튼 클릭</p>
            <p className="text-2xl text-gray-600">초록 버튼을 눌러주세요</p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto mb-2">
              3
            </div>
            <p className="text-2xl font-medium text-gray-800">자유롭게 답변</p>
            <p className="text-2xl text-gray-600">생각나는 대로 말해주세요</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto mb-2">
              4
            </div>
            <p className="text-2xl font-medium text-gray-800">다음으로 이동</p>
            <p className="text-2xl text-gray-600">다음 버튼을 눌러주세요</p>
          </div>
        </div>
      </div>
    </section>
  )

  const renderTips = () => (
    <section>
      <div className="bg-yellow-50 p-6 rounded-lg">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2 text-xl">🎯 효과적인 훈련을 위해</h4>
            <ul className="text-2xl text-gray-600 space-y-1">
              <li>• 편안한 환경에서 진행하세요</li>
              <li>• 무리하지 말고 천천히 참여하세요</li>
              <li>• 정답이 없으니 자유롭게 표현하세요</li>
              <li>• 매일 조금씩 꾸준히 해보세요</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2 text-xl">💡 더 나은 경험을 위해</h4>
            <ul className="text-2xl text-gray-600 space-y-1">
              <li>• 가족과 함께 참여해보세요</li>
              <li>• 기록하기 기능으로 추억을 남겨보세요</li>
              <li>• 되돌아보기로 과거 활동을 확인하세요</li>
              <li>• 모임 기능으로 다른 분들과 소통하세요</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )

  const renderFAQ = () => (
    <section>
      <div className="space-y-3">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2 text-3xl">Q. 프로그램을 꼭 순서대로 해야 하나요?</h4>
                     <p className="text-3xl text-gray-600" style={{ fontFamily: 'Paperlogy, sans-serif' }}>
             A. 순서대로 하시면 더 효과적이지만, 원하는 프로그램부터 시작하셔도 괜찮습니다. 본인의 관심사와 컨디션에 맞춰 선택하세요.
           </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2 text-3xl">Q. 하루에 몇 개의 프로그램을 해도 되나요?</h4>
          <p className=" text-3xl text-gray-600 text-2xl">
            A. 각 프로그램이 15분이므로 하루에 1-2개 정도가 적당합니다. 무리하지 마시고 편안하게 참여하세요.
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2 text-3xl">Q. 정답을 맞춰야 하나요?</h4>
          <p className="text-3xl text-gray-600 text-2xl">
            A. 정답이 없습니다! 자유롭게 생각나는 것들을 표현하시면 됩니다. 기억을 되살리고 감정을 나누는 것이
            목적입니다.
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2 text-3xl">Q. 가족과 함께 할 수 있나요?</h4>
          <p className="text-3xl text-gray-600 text-2xl">
            A. 네! 가족이나 친구들과 함께 참여하시면 더욱 즐겁고 의미 있는 시간을 보낼 수 있습니다.
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2 text-3xl">Q. 녹음 버튼을 눌렀는데 소리가 안 들려요</h4>
          <p className="text-3xl text-gray-600 text-2xl">
            A. 브라우저에서 마이크 권한을 허용해주세요. 화면 상단에 마이크 허용 알림이 나타나면 <strong>허용</strong>을 클릭하세요.
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2 text-3xl">Q. 내 목소리가 제대로 녹음되고 있나요?</h4>
          <p className="text-3xl text-gray-600 text-2xl">
            A. 녹음 중일 때 화면에 파형이 움직이면 정상적으로 녹음되고 있는 것입니다. 녹음 후 재생 버튼으로
            확인해보세요.
          </p>
        </div>
      </div>

      {/* 연락처 */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg text-center">
        <h3 className="text-3xl font-bold text-gray-800 mb-2">더 궁금한 것이 있으시다면?</h3>
        <p className="text-3xl gray-600 mb-4">언제든지 문의해 주세요. 친절하게 도와드리겠습니다.</p>
      </div>
    </section>
  )

  const renderContent = () => {
    switch (activeTab) {
      case "intro":
        return renderProgramIntro()
      case "order":
        return renderTrainingOrder()
      case "features":
        return renderFeatures()
      case "guide":
        return renderTrainingGuide()
      case "process":
        return renderTrainingProcess()
      case "tips":
        return renderTips()
      case "faq":
        return renderFAQ()
      default:
        return renderProgramIntro()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-none !w-[85vw] max-h-[90vh] overflow-hidden flex flex-col" style={{ width: '85vw', maxWidth: '1200px', fontFamily: 'Paperlogy, sans-serif' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4 text-5xl font-bold" style={{ fontFamily: 'Paperlogy, sans-serif' }}>
            <HelpCircle className="w-12 h-12 text-blue-600" />
            기억의 정원 사용 도우미
          </DialogTitle>
        </DialogHeader>

        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-2 overflow-x-auto">
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-4 px-8 py-5 text-xl font-semibold rounded-t-lg whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-50 text-blue-600 border-b-4 border-blue-600"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                  style={{ fontFamily: 'Paperlogy, sans-serif' }}
                >
                  <IconComponent className="w-7 h-7" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto text-xl" style={{ fontFamily: 'Paperlogy, sans-serif' }}>{renderContent()}</div>
      </DialogContent>
    </Dialog>
  )
}