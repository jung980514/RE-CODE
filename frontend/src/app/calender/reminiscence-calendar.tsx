"use client"
import { useState, useMemo, useEffect } from "react"
import { ChevronLeft, ChevronRight, Calendar, Heart, BookOpen, Play, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import type { TrainingRecord } from "@/app/calender/page"

interface ReminiscenceCalendarProps {
  trainingRecords: TrainingRecord[]
  onDateClick: (record: TrainingRecord) => void
}

export function ReminiscenceCalendar({ trainingRecords, onDateClick }: ReminiscenceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showPicker, setShowPicker] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const totalDays = daysInMonth(year, month)
  const startDay = firstDayOfMonth(year, month)
  const prevMonthDays = daysInMonth(year, month - 1)

  const calendarDays = useMemo(() => {
    const days = []

    // Days from previous month
    for (let i = startDay; i > 0; i--) {
      days.push({
        date: new Date(Date.UTC(year, month - 1, prevMonthDays - i + 1)), // Use Date.UTC
        isCurrentMonth: false,
      })
    }

    // Days of current month
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(Date.UTC(year, month, i)), // Use Date.UTC
        isCurrentMonth: true,
      })
    }

    // Days from next month to fill the grid
    const remainingCells = 42 - days.length
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        date: new Date(Date.UTC(year, month + 1, i)), // Use Date.UTC
        isCurrentMonth: false,
      })
    }

    return days
  }, [year, month, totalDays, startDay, prevMonthDays])

  const getRecordForDate = (date: Date) => {
    const formattedDate = date.toISOString().split("T")[0]
    return trainingRecords.find((record) => record.date === formattedDate)
  }

  const goToPreviousMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
    setShowPicker(false)
  }

  const goToNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
    setShowPicker(false)
  }

  const handleYearChange = (selectedYear: string) => {
    setCurrentDate(new Date(Number.parseInt(selectedYear), month, 1))
  }

  const handleMonthChange = (selectedMonth: string) => {
    setCurrentDate(new Date(year, Number.parseInt(selectedMonth), 1))
  }

  const dayNames = ["일", "월", "화", "수", "목", "금", "토"]

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i)

  // Calculate monthly statistics
  const currentMonthRecords = trainingRecords.filter((record) => {
    const recordDate = new Date(record.date)
    return recordDate.getFullYear() === year && recordDate.getMonth() === month
  })

  const participationCount = currentMonthRecords.length
  const positiveEmotionCount = currentMonthRecords.filter(
    (record) =>
      record.overallEmotionEmoji === "😊" || record.overallEmotionEmoji === "😄" || record.overallEmotionEmoji === "❤️",
  ).length
  const positiveEmotionRatio =
    participationCount > 0 ? ((positiveEmotionCount / participationCount) * 100).toFixed(0) : "0"

  // 월간 목표 달성률 계산 (주 1회 = 월 4회 목표)
  const weeklyGoal = 2 // 주당 1회
  const weeksInMonth = 4 // 한 달 약 4주
  const monthlyGoal = weeklyGoal * weeksInMonth
  const monthlyAchievementRatio = Math.min(100, Math.round((participationCount / monthlyGoal) * 100))

  // 슬라이드 데이터 정의
  const slides = [
    {
      id: 1,
      icon: "1",
      title: "훈련 참여",
      description: "기록하기 메뉴에 회상훈련을 시작하세요.",
      bgColor: "from-blue-50 to-blue-100",
      borderColor: "border-blue-200",
      iconColor: "bg-blue-500"
    },
    {
      id: 2,
      icon: "2",
      title: "기록 확인",
      description: "캘린더 메뉴에서 날짜를 클릭하여 상세히 보실 수도 있습니다",
      bgColor: "from-green-50 to-green-100",
      borderColor: "border-green-200",
      iconColor: "bg-green-500"
    },
    {
      id: 3,
      icon: "3",
      title: "목표 달성",
      description: "주 1회를 목표로 꾸준히 참여해보세요.",
      bgColor: "from-purple-50 to-purple-100",
      borderColor: "border-purple-200",
      iconColor: "bg-purple-500"
    },
    {
      id: 4,
      icon: "💡",
      title: "전문가 권장사항",
      description: "회상 훈련은 일반적으로 주 1~2회를 권장하지만, 전문가와 상담하여 대상자의 특성에 맞춰 맞춤형으로 진행하는 것이 좋습니다.",
      bgColor: "from-red-50 to-red-100",
      borderColor: "border-red-200",
      iconColor: "bg-red-500"
    }
  ]

  // 자동 슬라이드 진행
  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 3000) // 3초마다 자동 진행

    return () => clearInterval(interval)
  }, [isAutoPlaying, slides.length])

  // 슬라이드 클릭 핸들러
  const handleSlideClick = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false) // 클릭 시 자동 재생 일시 정지
    
    // 5초 후 자동 재생 재개
    setTimeout(() => {
      setIsAutoPlaying(true)
    }, 5000)
  }

  // 다음 슬라이드로 이동
  const nextSlide = () => {
    handleSlideClick((currentSlide + 1) % slides.length)
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl">
      <Card className="w-full md:flex-1 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth} aria-label="Previous month">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 flex justify-center">
            {showPicker ? (
              <div className="flex gap-2">
                <Select onValueChange={handleYearChange} value={year.toString()}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="년도" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}년
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select onValueChange={handleMonthChange} value={month.toString()}>
                  <SelectTrigger className="w-[80px]">
                    <SelectValue placeholder="월" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i).map((m) => (
                      <SelectItem key={m} value={m.toString()}>
                        {m + 1}월
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <CardTitle
                className="text-2xl font-semibold text-center cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => setShowPicker(true)}
                role="button"
                aria-label={`${year}년 ${month + 1}월 선택`}
              >
                {year}년 {month + 1}월
              </CardTitle>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={goToNextMonth} aria-label="Next month">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-600 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const record = getRecordForDate(day.date)
              const isToday = day.date.toDateString() === new Date().toDateString()
              const cellClasses = `
                relative flex flex-col items-center justify-center p-2 aspect-square rounded-md
                ${day.isCurrentMonth ? "bg-white text-gray-900" : "bg-gray-50 text-gray-400"}
                ${isToday ? "border-2 border-blue-500" : ""}
                ${record ? "cursor-pointer hover:bg-gray-100 transition-colors" : ""}
                hover:bg-blue-100
              `
              return (
                <div
                  key={index}
                  className={cellClasses}
                  onClick={() => record && onDateClick(record)}
                  role="button"
                  aria-label={`${day.date.getDate()}일 ${record ? `훈련 기록: ${record.overallEmotionEmoji} 이모지` : ""}`}
                >
                  <span className="absolute top-2 left-2 text-lg font-semibold">{day.date.getDate()}</span>
                  {record && (
                    <img 
                      src="/images/참 잘했어요.png" 
                      alt="참 잘했어요" 
                      className="absolute bottom-2 w-12 h-12 object-contain"
                      aria-hidden="true"
                    />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Statistics Cards - Styled to match image */}
      <div className="md:w-64">
        <Card className="p-4 shadow-lg bg-white border border-blue-200 border-dashed shadow-md" style={{height: '100%'}}>
          <div className="h-full flex flex-col">
            {/* 상단 섹션: 훈련 정보 */}
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-6 w-6 text-blue-600" />
                <h3 className="text-2xl font-semibold text-gray-800" style={{fontFamily: 'Pretendard'}}>이번 달 훈련</h3>
              </div>
              <div className="text-blue-600 text-5xl font-bold mb-3" style={{fontFamily: 'Paperlogy'}}>{participationCount}회</div>
              
              {/* 목표 달성률 - 컴팩트 */}
              <div className="mb-4">
                <div className="text-center mb-2">
                  <span className="text-lg text-gray-700 block mb-1 font-bold" style={{fontFamily: 'Pretendard'}}>월간 목표 달성률</span>
                  <span className="text-3xl font-bold text-blue-600" style={{fontFamily: 'Paperlogy'}}>{monthlyAchievementRatio}%</span>
                </div>
                <div className="flex justify-center mb-2">
                  <div className="relative w-5 h-16 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="absolute bottom-0 w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-full transition-all duration-500 ease-out"
                      style={{height: `${monthlyAchievementRatio}%`}}
                    ></div>
                  </div>
                </div>
                <p className="text-base text-gray-600 text-center mb-0" style={{fontFamily: 'Pretendard'}}>목표: 주 {weeklyGoal}회 (월 {monthlyGoal}회)</p>
              </div>
            </div>
            
            {/* 구분선 */}
            <div className="border-t border-gray-200 my-4 flex-shrink-0"></div>
            
            {/* 하단 섹션: 사용법 안내 슬라이드 - 남은 공간 모두 활용 */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-3 mb-4 flex-shrink-0">
                <BookOpen className="h-6 w-6 text-blue-600" />
                <h4 className="text-xl font-bold text-gray-800" style={{fontFamily: 'Pretendard'}}>사용법 안내</h4>
              </div>
              
              {/* 슬라이드 컨테이너 - 남은 공간 최대 활용 */}
              <div className="relative flex-1 flex flex-col justify-center min-h-0">
                <Card 
                  className={`p-6 shadow-sm bg-gradient-to-r ${slides[currentSlide].bgColor} border ${slides[currentSlide].borderColor} hover:shadow-md transition-all duration-700 cursor-pointer flex-1 flex items-center overflow-hidden`}
                  onClick={nextSlide}
                  style={{minHeight: '200px'}}
                >
                  <div className="flex items-start gap-4 w-full h-full">
                    <div className="flex-1 overflow-hidden">
                      <p 
                        className="text-2xl font-bold text-gray-800 mb-4 truncate" 
                        style={{fontFamily: 'Pretendard'}}
                        title={slides[currentSlide].title}
                      >
                        {slides[currentSlide].title}
                      </p>
                      <p 
                        className={`${slides[currentSlide].id === 4 ? 'text-xl' : 'text-2xl'} text-gray-600 leading-relaxed`}
                        style={{
                          fontFamily: 'Paperlogy',
                          ...(slides[currentSlide].id === 4 ? {
                            // 전문가 권장사항은 전체 텍스트 표시 + 작은 글자
                            overflow: 'visible',
                            display: 'block',
                            lineHeight: '1.5'
                          } : {
                            // 다른 슬라이드는 4줄 제한
                            display: '-webkit-box',
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          })
                        }}
                        title={slides[currentSlide].description}
                      >
                        {slides[currentSlide].description}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* 슬라이드 인디케이터 */}
                <div className="flex justify-center mt-4 gap-3 flex-shrink-0">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleSlideClick(index)}
                      className={`w-4 h-4 rounded-full transition-all duration-300 ${
                        index === currentSlide 
                          ? 'bg-blue-600 scale-125' 
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`슬라이드 ${index + 1}로 이동`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
