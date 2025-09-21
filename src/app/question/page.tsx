"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { QuizModal } from "@/components/quiz-modal"

export default function HomePage() {
  const [isQuizOpen, setIsQuizOpen] = useState(false)
  const [isAdultMode, setIsAdultMode] = useState(false)

  const handleKidsMode = () => {
    setIsAdultMode(false)
    setIsQuizOpen(true)
  }

  const handleAdultMode = () => {
    setIsAdultMode(true)
    setIsQuizOpen(true)
  }

  return (
    <div className="h-screen relative overflow-hidden">
      {/* 背景レイヤー：グラデーション */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-[#0b001f] to-[#33446a]" />
      {/* 背景レイヤー：デスクトップ時の画像（グラデの上に画像） */}
      <div className="absolute inset-0 -z-10 hidden lg:block bg-[url('/image/top_bg.png')] bg-contain bg-center bg-no-repeat" />

      {/* ★ 下4分の1パネル（少し上げて下に余白） ★ */}
      <div className="absolute bottom-0 left-0 right-0 h-1/4 z-10 lg:-translate-y-6">
        <div className="mx-auto max-w-5xl h-full px-8">
          <div className="h-full flex flex-col justify-center gap-5 text-white pb-8">
            {/* 説明（白・大きめ） */}
            <div className="text-center -translate-y-4 md:-translate-y-6">
              <p className="text-2xl md:text-4xl leading-relaxed opacity-95 font-semibold whitespace-nowrap">
                🍏 質問に答えて、あなただけのオリジナルのりんご飴を生み出そう 🍎
              </p>
              <p className="text-2xl md:text-4xl leading-relaxed opacity-95 font-semibold mt-2 whitespace-nowrap">
                りんご飴の種類は全部で
                <strong className="font-extrabold text-firework-gold"> 13,824 </strong>
                通り！
              </p>
            </div>


            {/* モード切り替えボタン（横並び・強調） */}
            <div className="flex items-center gap-4 justify-center -translate-y-2 md:-translate-y-4">
              <Button
                onClick={handleKidsMode}
                className="text-3xl px-14 py-10 rounded-2xl font-bold 
             bg-gradient-to-r from-firework-pink to-firework-gold 
             hover:from-lime-300 hover:to-yellow-300
             text-white shadow-2xl ring-2 ring-white/20 transition 
             min-w-[260px]"
              >
                キッズモード
              </Button>

              <Button
                onClick={handleAdultMode}
                className="text-2xl px-12 py-10 rounded-2xl font-bold 
                     bg-gradient-to-r from-indigo-400 via-purple-500 to-blue-600 
                     hover:from-purple-500 hover:to-indigo-600
                     text-white shadow-xl ring-2 ring-white/20 transition 
                     min-w-[240px]"
              >
                ちょっぴり大人なモード
              </Button>
            </div>

            {/* 小さめの統計表示（明るくカラフル） */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-xl bg-firework-pink/15 border border-firework-pink/30">
                <div className="text-lg font-bold text-firework-pink">7</div>
                <div className="text-[12px] opacity-90">問題数</div>
              </div>
              <div className="p-3 rounded-xl bg-firework-gold/15 border border-firework-gold/30">
                <div className="text-lg font-bold text-firework-gold">3–6</div>
                <div className="text-[12px] opacity-90">選択肢</div>
              </div>
              <div className="p-3 rounded-xl bg-firework-mint/15 border border-firework-mint/30">
                <div className="text-lg font-bold text-firework-mint">5分</div>
                <div className="text-[12px] opacity-90">所要時間</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* モーダルは最上位でOK */}
      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        isAdult={isAdultMode}
      />
    </div>
  )
}