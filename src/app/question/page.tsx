"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { QuizModal } from "@/components/quiz-modal"

export default function HomePage() {
  const [isQuizOpen, setIsQuizOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background firework-bg relative overflow-hidden">
      {/* 花火のような装飾要素 */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-20 left-20 w-6 h-6 bg-firework-gold rounded-full sparkle-animation"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="absolute top-40 right-32 w-4 h-4 bg-firework-pink rounded-full float-animation"
          style={{ animationDelay: "0.5s" }}
        />
        <div
          className="absolute bottom-32 left-40 w-8 h-8 bg-firework-blue rounded-full sparkle-animation"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-60 left-1/2 w-3 h-3 bg-firework-mint rounded-full float-animation"
          style={{ animationDelay: "1.5s" }}
        />
        <div
          className="absolute bottom-20 right-20 w-5 h-5 bg-firework-purple rounded-full sparkle-animation"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-32 right-1/4 w-4 h-4 bg-firework-gold rounded-full float-animation"
          style={{ animationDelay: "2.5s" }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center space-y-8 max-w-2xl">
          <h1 className="text-6xl md:text-8xl font-bold text-balance">
            <span className="bg-gradient-to-r from-firework-pink via-firework-gold to-firework-mint bg-clip-text text-transparent">
              ✨クイズ✨
            </span>
            <br />
            <span className="text-foreground">チャレンジ</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground text-pretty leading-relaxed">
            🌟 7つの質問に答えて、あなたの知識を試してみましょう！
            <br />
            各問題には3〜6つの選択肢があります 🎯
          </p>

          <div className="pt-8">
            <Button
              onClick={() => setIsQuizOpen(true)}
              size="lg"
              className="text-xl px-16 py-8 cute-button bg-gradient-to-r from-firework-pink to-firework-gold hover:from-firework-gold hover:to-firework-purple text-white font-bold pulse-glow"
            >
              🚀 クイズを開始する
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-12 text-center">
            <div className="space-y-3 p-4 rounded-2xl bg-firework-pink/10 border border-firework-pink/20">
              <div className="text-4xl font-bold text-firework-pink">7</div>
              <div className="text-sm text-muted-foreground font-medium">問題数</div>
            </div>
            <div className="space-y-3 p-4 rounded-2xl bg-firework-gold/10 border border-firework-gold/20">
              <div className="text-4xl font-bold text-firework-gold">3-6</div>
              <div className="text-sm text-muted-foreground font-medium">選択肢</div>
            </div>
            <div className="space-y-3 p-4 rounded-2xl bg-firework-mint/10 border border-firework-mint/20">
              <div className="text-4xl font-bold text-firework-mint">5分</div>
              <div className="text-sm text-muted-foreground font-medium">所要時間</div>
            </div>
          </div>
        </div>
      </div>

      <QuizModal isOpen={isQuizOpen} onClose={() => setIsQuizOpen(false)} />
    </div>
  )
}
