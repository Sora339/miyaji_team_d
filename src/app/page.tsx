"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

export default function HomePage() {
  const router = useRouter()
  const [isStarting, setIsStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)

  const handleStart = async () => {
    if (isStarting) return

    setIsStarting(true)
    setStartError(null)

    try {
      const response = await fetch('/api/results', {
        method: 'POST',
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || '結果データの初期化に失敗しました。')
      }

      const data = await response.json()

      if (!data?.resultId) {
        throw new Error('結果IDを取得できませんでした。')
      }

      router.push(`/question/${data.resultId}`)
    } catch (error) {
      console.error(error)
      setStartError(error instanceof Error ? error.message : '結果データの生成に失敗しました。')
      setIsStarting(false)
    }
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
          backgroundPosition: "0 -15%",
        }}
      />

      {/* コンテンツエリア：中央寄せで START ボタンのみ */}
      <div className="absolute bottom-0 left-0 right-0 z-10 h-[35%]">
        <div className="h-full flex flex-col justify-center">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center">
              <div className="flex flex-col items-center gap-4">
                <Button
                  onClick={handleStart}
                  disabled={isStarting}
                  className="
                    overflow-hidden
                    !rounded-full
                    text-[clamp(1.5rem,3vw,3rem)]   /* 大きめ文字 */
                    px-[clamp(3rem,8vw,10rem)]      /* 横幅広く */
                    py-[clamp(2rem,5vw,6rem)]       /* 縦幅も大きく */
                    font-extrabold
                    bg-gradient-to-r from-firework-pink to-firework-gold
                    hover:from-orange-300 hover:to-yellow-300
                    text-white shadow-2xl
                    ring-4 ring-white/20 ring-offset-2
                    transition
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  {isStarting ? 'STARTING...' : 'START'}
                </Button>
                {startError && (
                  <p className="text-sm text-red-300 text-center max-w-sm">
                    {startError}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
