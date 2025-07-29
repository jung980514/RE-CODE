"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { SkipBackIcon as Backspace, Space, CornerDownLeft } from "lucide-react"

// Jamo constants for Korean composition
const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ"
const JOONG = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ"
const JONG = " ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ" // First element is empty for no final consonant

// Helper to get jamo index by type
function getJamoIndex(char: string, type: "cho" | "joong" | "jong") {
  switch (type) {
    case "cho":
      return CHO.indexOf(char)
    case "joong":
      return JOONG.indexOf(char)
    case "jong":
      return JONG.indexOf(char)
    default:
      return -1
  }
}

// Helper to decompose a Hangul syllable into its jamo indices
function decomposeHangulToIndices(char: string) {
  const code = char.charCodeAt(0)
  if (code < 0xac00 || code > 0xd7a3) return null // Not a Hangul syllable

  const uni = code - 0xac00
  const choIdx = Math.floor(uni / 588)
  const joongIdx = Math.floor((uni - choIdx * 588) / 28)
  const jongIdx = uni % 28

  return { choIdx, joongIdx, jongIdx }
}

// Helper to compose jamo indices into a Hangul syllable
function composeHangul(choIdx: number, joongIdx: number, jongIdx = 0) {
  if (choIdx === -1 || joongIdx === -1) return null
  const code = 0xac00 + choIdx * 588 + joongIdx * 28 + jongIdx
  return String.fromCharCode(code)
}

interface VirtualKeyboardProps {
  onKeyPress: (key: string, replaceLast?: boolean) => void
  onBackspace: () => void
  onSpace: () => void
  onEnter: () => void
  isVisible: boolean
  onToggle: () => void
  currentInputValue: string // 현재 입력 필드의 값 (한글 조합을 위해 필요)
}

export function VirtualKeyboard({
  onKeyPress,
  onBackspace,
  onSpace,
  onEnter,
  isVisible,
  onToggle,
  currentInputValue,
}: VirtualKeyboardProps) {
  const [mode, setMode] = useState<"korean" | "english" | "number">("korean")
  const [isShift, setIsShift] = useState(false)

  // 드래그 기능 관련 상태
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }) // 현재 translation offset
  const [isDragging, setIsDragging] = useState(false)
  const dragStartMousePos = useRef({ x: 0, y: 0 })
  const dragStartKeyboardPos = useRef({ x: 0, y: 0 })

  const keyboardRef = useRef<HTMLDivElement>(null)

  // 드래그 시작
  const handleMouseDown = (e: React.MouseEvent) => {
    if (keyboardRef.current) {
      setIsDragging(true)
      dragStartMousePos.current = { x: e.clientX, y: e.clientY }
      dragStartKeyboardPos.current = { x: dragOffset.x, y: dragOffset.y } // 현재 오프셋 저장
    }
  }

  // 드래그 중
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStartMousePos.current.x
        const deltaY = e.clientY - dragStartMousePos.current.y
        setDragOffset({
          x: dragStartKeyboardPos.current.x + deltaX,
          y: dragStartKeyboardPos.current.y + deltaY,
        })
      }
    }

    // 드래그 종료
    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    } else {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, dragOffset]) // dragOffset을 의존성 배열에 추가하여 최신 값 사용 보장

  const koreanKeys = [
    ["ㅂ", "ㅈ", "ㄷ", "ㄱ", "ㅅ", "ㅛ", "ㅕ", "ㅑ", "ㅐ", "ㅔ"],
    ["ㅁ", "ㄴ", "ㅇ", "ㄹ", "ㅎ", "ㅗ", "ㅓ", "ㅏ", "ㅣ"],
    ["ㅋ", "ㅌ", "ㅊ", "ㅍ", "ㅠ", "ㅜ", "ㅡ"],
    ["ㅃ", "ㅉ", "ㄸ", "ㄲ", "ㅆ"],
  ]

  const englishKeys = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["z", "x", "c", "v", "b", "n", "m"],
  ]

  const numberKeys = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")"],
    ["-", "=", "[", "]", ";", "'", ",", ".", "/", "\\"],
  ]

  const getCurrentKeys = () => {
    switch (mode) {
      case "korean":
        return koreanKeys
      case "english":
        return englishKeys.map((row) => row.map((key) => (isShift ? key.toUpperCase() : key)))
      case "number":
        return numberKeys
      default:
        return koreanKeys
    }
  }

  const handleKeyPress = (key: string) => {
    if (mode === "korean") {
      const newJamo = key
      const lastChar = currentInputValue.slice(-1)
      const lastCharDecomposed = decomposeHangulToIndices(lastChar)

      let handled = false

      if (lastCharDecomposed) {
        // 마지막 글자가 한글 완성형 글자일 경우
        const newJamoJongIdx = getJamoIndex(newJamo, "jong") // 새 자모가 종성인지 확인
        if (newJamoJongIdx !== -1 && lastCharDecomposed.jongIdx === 0) {
          // 마지막 글자에 종성이 없고, 새 자모가 종성일 경우 -> 종성 추가 조합
          const newSyllable = composeHangul(lastCharDecomposed.choIdx, lastCharDecomposed.joongIdx, newJamoJongIdx)
          if (newSyllable) {
            onKeyPress(newSyllable, true) // 마지막 글자 대체
            handled = true
          }
        }
        // 그 외 복잡한 한글 조합 (예: 겹받침, 재조합)은 이 기본 IME에서 처리하지 않음
      } else {
        // 마지막 글자가 한글 완성형 글자가 아닐 경우 (자모 또는 영문/숫자)
        const lastJamoChoIdx = getJamoIndex(lastChar, "cho") // 마지막 글자가 초성인지 확인
        const newJamoJoongIdx = getJamoIndex(newJamo, "joong") // 새 자모가 중성인지 확인

        if (lastJamoChoIdx !== -1 && newJamoJoongIdx !== -1) {
          // 마지막 글자가 초성이고, 새 자모가 중성일 경우 -> 초성+중성 조합
          const newSyllable = composeHangul(lastJamoChoIdx, newJamoJoongIdx)
          if (newSyllable) {
            onKeyPress(newSyllable, true) // 마지막 글자 대체
            handled = true
          }
        }
      }

      if (!handled) {
        onKeyPress(key) // 조합되지 않으면 그냥 추가
      }
    } else {
      // 영문 또는 숫자 모드
      onKeyPress(key)
      if (mode === "english" && isShift) {
        setIsShift(false) // 한 글자 입력 후 Shift 해제
      }
    }
  }

  const handleVirtualBackspace = () => {
    // 입력값이 없을 경우, 아무 동작도 하지 않고 종료
    if (currentInputValue.length === 0) {
      return
    }

    const lastChar = currentInputValue.slice(-1)
    const decomposed = decomposeHangulToIndices(lastChar)

    if (decomposed) {
      // 마지막 글자가 한글 완성형 글자일 경우
      if (decomposed.jongIdx !== 0) {
        // 종성이 있을 경우 -> 종성 제거
        const syllableWithoutFinal = composeHangul(decomposed.choIdx, decomposed.joongIdx, 0)
        if (syllableWithoutFinal) {
          onKeyPress(syllableWithoutFinal, true) // 종성 없는 글자로 대체
        } else {
          onBackspace() // 대체 실패 시 일반 백스페이스
        }
      } else if (decomposed.joongIdx !== -1) {
        // 중성이 있을 경우 (초성+중성) -> 초성만 남김
        const choChar = CHO[decomposed.choIdx]
        if (choChar) {
          onKeyPress(choChar, true) // 초성으로 대체
        } else {
          onBackspace() // 대체 실패 시 일반 백스페이스
        }
      } else {
        // 초성만 있는 경우 (이 경우는 decomposeHangulToIndices가 null을 반환해야 함)
        onBackspace() // 일반 백스페이스
      }
    } else {
      // 한글 완성형 글자가 아닐 경우 (자모 또는 영문/숫자)
      onBackspace() // 일반 백스페이스
    }
  }

  // isVisible이 false일 때는 아무것도 렌더링하지 않음
  if (!isVisible) {
    return null
  }

  return (
    <div
      ref={keyboardRef}
      // position: absolute로 변경하여 부모 요소(DialogContent) 내에서 위치 지정
      className="absolute bg-neutral-900 border-2 border-neutral-700 shadow-2xl z-[9999] text-white rounded-lg overflow-hidden"
      style={{
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`, // transform으로 드래그 위치 적용
        cursor: isDragging ? "grabbing" : "grab",
      }}
    >
      {/* 드래그 핸들 영역 */}
      <div className="p-4 cursor-grab" onMouseDown={handleMouseDown}>
        {/* 키보드 헤더 */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            <Button
              onClick={() => setMode("korean")}
              className={`text-lg px-4 py-2 ${
                mode === "korean" ? "bg-[#4A90E2] hover:bg-[#3A7BC8]" : "bg-neutral-700 hover:bg-neutral-600 text-white"
              }`}
            >
              한글
            </Button>
            <Button
              onClick={() => setMode("english")}
              className={`text-lg px-4 py-2 ${
                mode === "english"
                  ? "bg-[#4A90E2] hover:bg-[#3A7BC8]"
                  : "bg-neutral-700 hover:bg-neutral-600 text-white"
              }`}
            >
              영문
            </Button>
            <Button
              onClick={() => setMode("number")}
              className={`text-lg px-4 py-2 ${
                mode === "number" ? "bg-[#4A90E2] hover:bg-[#3A7BC8]" : "bg-neutral-700 hover:bg-neutral-600 text-white"
              }`}
            >
              숫자/문자
            </Button>
            {mode === "english" && (
              <Button
                onClick={() => setIsShift(!isShift)}
                className={`text-lg px-4 py-2 ${
                  isShift ? "bg-[#4A90E2] hover:bg-[#3A7BC8]" : "bg-neutral-700 hover:bg-neutral-600 text-white"
                }`}
              >
                {isShift ? "대문자" : "소문자"}
              </Button>
            )}
          </div>
          <Button onClick={onToggle} className="text-lg px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white">
            키보드 숨기기
          </Button>
        </div>

        {/* 키보드 본체 */}
        <div className="space-y-2">
          {getCurrentKeys().map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center space-x-1">
              {row.map((key, keyIndex) => (
                <Button
                  key={keyIndex}
                  onClick={() => handleKeyPress(key)}
                  className="text-xl font-semibold px-4 py-4 h-auto min-w-[50px] bg-neutral-700 hover:bg-neutral-600 text-white border border-neutral-600 rounded-md"
                >
                  {key}
                </Button>
              ))}
            </div>
          ))}

          {/* 기능키 행 */}
          <div className="flex justify-center space-x-1 mt-4">
            <Button
              onClick={handleVirtualBackspace}
              className="text-lg px-6 py-4 h-auto bg-red-700 hover:bg-red-600 text-white border border-red-600 rounded-md"
            >
              <Backspace className="w-5 h-5 mr-2" />
              지우기
            </Button>
            <Button
              onClick={onSpace}
              className="text-lg px-12 py-4 h-auto bg-neutral-700 hover:bg-neutral-600 text-white border border-neutral-600 rounded-md"
            >
              <Space className="w-5 h-5 mr-2" />
              띄어쓰기
            </Button>
            <Button
              onClick={onEnter}
              className="text-lg px-6 py-4 h-auto bg-[#4A90E2] hover:bg-[#3A7BC8] text-white rounded-md"
            >
              <CornerDownLeft className="w-5 h-5 mr-2" />
              완료
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}