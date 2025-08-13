"use client"
import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, Calendar, Heart } from "lucide-react"
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

  const totalTrainingMinutes = currentMonthRecords.reduce((sum, record) => {
    return sum + record.questions.reduce((qSum, question) => qSum + question.durationInMinutes, 0)
  }, 0)

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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-1 md:w-64">
        <Card className="p-4 shadow-lg bg-white border border-blue-200 border-dashed shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-semibold text-gray-800">이번 달 훈련</h3>
          </div>
          <div className="text-blue-600 text-4xl font-bold mb-1">{participationCount}회</div>
          <p className="text-sm text-gray-600">총 {totalTrainingMinutes}분 훈련</p>
        </Card>

        <Card className="p-4 shadow-lg bg-white border border-pink-200 border-dashed shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="h-5 w-5 text-pink-600" />
            <h3 className="text-base font-semibold text-gray-800">긍정 감정 비율</h3>
          </div>
          <div className="text-pink-600 text-4xl font-bold mb-2">{positiveEmotionRatio}%</div>
          <Progress
            value={Number.parseFloat(positiveEmotionRatio)}
            className="w-full h-2 bg-gray-200"
          />
        </Card>
      </div>
    </div>
  )
}
