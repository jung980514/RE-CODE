"use client"

import Demo from "@/app/main-elder/demo"
import { FloatingButtons } from "@/components/common/Floting-Buttons"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAuth } from "@/lib/useAuth"

export default function Page() {
  // 노인 사용자만 접근 가능하도록 인증 보호
  const { isLoggedIn, role, isLoading } = useAuth('ELDER');

  // 로딩 중일 때는 로딩 스피너 표시
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // 인증되지 않았거나 노인 사용자가 아닌 경우 빈 화면 표시 (리다이렉트 처리됨)
  if (!isLoggedIn || role !== 'ELDER') {
    return null;
  }

  return (
    <div>
      <Demo />
      <FloatingButtons /> 
    </div>
  )
}