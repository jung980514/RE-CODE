"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"

type ToastType = "flower" | "saint" | "warning" | "info"

interface Toast {
  id: number
  message: string
  type: ToastType
  autoClose?: boolean
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (message: string, type: ToastType, options?: { autoClose?: boolean }) => void
  removeToast: (id: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType, options?: { autoClose?: boolean }) => {
    const autoClose = options?.autoClose !== false // 기본값은 true, false로 설정하면 자동으로 닫히지 않음
    setToasts((prevToasts) => [...prevToasts, { id: Date.now(), message, type, autoClose }])
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
  }, [])

  return <ToastContext.Provider value={{ toasts, addToast, removeToast }}>{children}</ToastContext.Provider>
}
