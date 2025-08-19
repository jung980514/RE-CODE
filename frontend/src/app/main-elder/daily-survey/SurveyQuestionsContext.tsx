"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { Question } from "./types"
import { buildQuestionsFromServer, fetchSurveyQuestionsWithCredentials } from "./surveyData"

export interface SurveyQuestionsContextValue {
  questions: Question[]
  isLoading: boolean
  error: string | null
}

const SurveyQuestionsContext = createContext<SurveyQuestionsContextValue | undefined>(undefined)

export function useSurveyQuestionsContext(): SurveyQuestionsContextValue | undefined {
  return useContext(SurveyQuestionsContext)
}

export function SurveyQuestionsProvider({ children }: { children: React.ReactNode }) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        setError(null)
        const server = await fetchSurveyQuestionsWithCredentials()
        if (!isMounted) return
        setQuestions(buildQuestionsFromServer(server))
      } catch (e: unknown) {
        if (!isMounted) return
        const message = e instanceof Error ? e.message : "설문 질문을 불러오지 못했습니다"
        setError(message)
        setQuestions([])
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [])

  const value = useMemo<SurveyQuestionsContextValue>(() => ({ questions, isLoading, error }), [questions, isLoading, error])

  return <SurveyQuestionsContext.Provider value={value}>{children}</SurveyQuestionsContext.Provider>
}


