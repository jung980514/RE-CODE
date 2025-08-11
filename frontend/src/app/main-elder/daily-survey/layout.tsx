"use client"

import React from "react"
import { SurveyQuestionsProvider } from "./SurveyQuestionsContext"

export default function DailySurveyLayout({ children }: { children: React.ReactNode }) {
  return (
    <SurveyQuestionsProvider>
      {children}
    </SurveyQuestionsProvider>
  )
}


