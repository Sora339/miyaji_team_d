"use client"

import { useMemo, useState } from "react"
import { useParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { QuizModal } from "@/components/quiz-modal"

export default function QuestionPage() {
  const params = useParams<{ formId: string }>()
  const resultId = useMemo(() => {
    const idParam = params?.formId
    if (!idParam) return null

    const parsed = Number(idParam)
    return Number.isFinite(parsed) ? parsed : null
  }, [params])

  const [isQuizOpen, setIsQuizOpen] = useState(false)
  const [isAdultMode, setIsAdultMode] = useState(false)

  const handleKidsMode = () => {
    if (resultId === null) return
    setIsAdultMode(false)
    setIsQuizOpen(true)
  }

  const handleAdultMode = () => {
    if (resultId === null) return
    setIsAdultMode(true)
    setIsQuizOpen(true)
  }

  return (
    <div className="h-screen relative overflow-hidden">
      {/* 背景レイヤー：グラデーション */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-[#0b001f] to-[#33446a]" />

      {/* 背景レイヤー：デスクトップ時の画像（上15%カット、上端固定） */}
      <div
        className="absolute inset-0 -z-10 hidden lg:block bg-no-repeat"
        style={{
          backgroundImage: "url('/image/top-bg-re.png')",
          backgroundSize: "100% auto",
          backgroundPosition: "0 -15%"
        }}
      />

      {/* コンテンツエリア：画面下部 30% に固定配置（中央寄せ） */}
      <div className="absolute bottom-0 left-0 right-0 z-10 h-[35%]">
        <div className="h-full flex flex-col justify-center">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div
              className="
          flex flex-col items-center 
          text-white 
          gap-[clamp(0.75rem,1.6vw,2rem)]   /* 全体ギャップも可変 */
        "
            >
              {/* 説明テキスト */}
              <div className="text-center space-y-[clamp(0.25rem,1vw,1rem)]">
                <p className="whitespace-normal leading-tight font-semibold text-[clamp(1rem,2.2vw,2rem)]">
                  🍏 質問に答えて、あなただけのオリジナルのりんご飴を生み出そう 🍎
                </p>
                <p className="whitespace-normal leading-tight font-semibold text-[clamp(1rem,2.2vw,2rem)]">
                  りんご飴の種類は全部で
                  <strong className="font-extrabold text-firework-gold">
                    {" "}
                    13,824{" "}
                  </strong>
                  通り！
                </p>
              </div>
              {/* モード切り替えボタン */}
              <div className="flex flex-col sm:flex-row items-center gap-[clamp(1rem,3vw,2.5rem)] w-full max-w-3xl">
                <Button
                  onClick={handleKidsMode}
                  disabled={resultId === null}
                  className="
      w-full sm:w-auto
      overflow-hidden
      !rounded-full                   /* ← 強制的に丸くする */
      text-[clamp(1.1rem,2vw,1.6rem)]
      px-[clamp(2rem,6vw,7rem)]
      py-[clamp(1.25rem,3.6vw,3.5rem)]
      font-bold
      bg-gradient-to-r from-firework-pink to-firework-gold
      hover:from-orange-300 hover:to-pink-500
      ring-4 ring-white/20 ring-offset-2 ring-offset-transparent
      transition
      disabled:opacity-50 disabled:cursor-not-allowed
      min-w-[240px] whitespace-nowrap
    "
                >
                  キッズモード
                </Button>

                <Button
                  onClick={handleAdultMode}
                  disabled={resultId === null}
                  className="
      w-full sm:w-auto
      overflow-hidden
      !rounded-full                   /* ← 同上 */
      text-[clamp(1rem,1.9vw,1.5rem)]
      px-[clamp(2rem,5.5vw,6.5rem)]
      py-[clamp(1.25rem,3.4vw,3.25rem)]
      font-bold
      bg-gradient-to-r from-indigo-400 via-purple-500 to-blue-600
      hover:from-purple-500 hover:to-indigo-600
      text-white shadow-xl
      ring-4 ring-white/20 ring-offset-2 ring-offset-transparent
      transition
      disabled:opacity-50 disabled:cursor-not-allowed
      min-w-[240px] whitespace-nowrap
    "
                >
                  ちょっぴり大人なモード
                </Button>
              </div>


            </div>
          </div>
        </div>
      </div>

      {/* モーダル */}
      {resultId !== null && (
        <QuizModal
          isOpen={isQuizOpen}
          onClose={() => setIsQuizOpen(false)}
          isAdult={isAdultMode}
          resultId={resultId}
        />
      )}
    </div>
  )
}
