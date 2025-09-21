"use client"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Star, X } from "lucide-react"

interface Question {
    id: number
    question: string
    options: string[]
}

interface QuizModalProps {
    isOpen: boolean
    onClose: () => void
    isAdult?: boolean // 大人向けコンテンツのフラグ
}

export function QuizModal({ isOpen, onClose, isAdult = false }: QuizModalProps) {
    const router = useRouter()
    const [questions, setQuestions] = useState<Question[]>([])
    const [loading, setLoading] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [currentQuestion, setCurrentQuestion] = useState(0)
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
    const [showResultButton, setShowResultButton] = useState(false)
    const [showFinalResult, setShowFinalResult] = useState(false)
    const [answers, setAnswers] = useState<number[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)

    const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0

    // 質問データの取得
    useEffect(() => {
        const fetchQuestions = async () => {
            if (!isOpen) return

            setLoading(true)
            setLoadError(null)

            try {
                const response = await fetch(`/api/questions?isAdult=${isAdult}`)

                if (!response.ok) {
                    throw new Error('質問の取得に失敗しました')
                }

                const data = await response.json()

                if (!data.success || !Array.isArray(data.questions)) {
                    throw new Error('無効なデータ形式です')
                }

                setQuestions(data.questions)
            } catch (err) {
                console.error('Failed to fetch questions:', err)
                setLoadError(err instanceof Error ? err.message : '質問の読み込みに失敗しました')
            } finally {
                setLoading(false)
            }
        }

        fetchQuestions()
    }, [isOpen, isAdult])

    useEffect(() => {
        if (isOpen) {
            // リセット
            setCurrentQuestion(0)
            setSelectedAnswer(null)
            setShowResultButton(false)
            setShowFinalResult(false)
            setAnswers([])
            setIsSubmitting(false)
            setUploadError(null)
        }
    }, [isOpen])

    // ローディング中や質問がない場合の表示
    if (loading) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-4xl w-full mx-4 bg-card border-2 border-firework-pink/30 firework-bg rounded-3xl shadow-2xl modal-transition">
                    <DialogTitle className="sr-only">アンケート質問</DialogTitle>
                    <div className="flex flex-col items-center justify-center py-16 space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-firework-gold"></div>
                        <p className="text-xl text-white">
                            {isAdult ? '大人向けの質問' : 'キッズ向けの質問'}を読み込み中...
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    if (loadError) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-4xl w-full mx-4 bg-card border-2 border-firework-pink/30 firework-bg rounded-3xl shadow-2xl modal-transition">
                    <div className="flex flex-col items-center justify-center py-16 space-y-6">
                        <div className="text-6xl">⚠️</div>
                        <h2 className="text-2xl font-bold text-foreground">エラーが発生しました</h2>
                        <p className="text-red-400">{loadError}</p>
                        <Button onClick={onClose} className="mt-4 bg-firework-gold text-white">
                            閉じる
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    if (questions.length === 0) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-4xl w-full mx-4 bg-card border-2 border-firework-pink/30 firework-bg rounded-3xl shadow-2xl modal-transition">
                    <div className="flex flex-col items-center justify-center py-16 space-y-6">
                        <div className="text-6xl">📝</div>
                        <h2 className="text-2xl font-bold text-foreground">質問がありません</h2>
                        <p className="text-muted-foreground">
                            現在{isAdult ? '大人向け' : 'キッズ向け'}の質問が利用できません。
                        </p>
                        <Button onClick={onClose} className="mt-4 bg-firework-gold text-white">
                            閉じる
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    const handleAnswerSelect = (answerIndex: number) => {
        setSelectedAnswer(answerIndex)
    }

    const handleNext = () => {
        if (selectedAnswer === null) return

        const newAnswers = [...answers, selectedAnswer]
        setAnswers(newAnswers)

        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1)
            setSelectedAnswer(null)
        } else {
            setShowResultButton(true)
        }
    }

    const handleShowResult = () => {
        setShowFinalResult(true)
    }

    const handleSubmitResults = async () => {
        if (isSubmitting) return

        setIsSubmitting(true)
        setUploadError(null)

        try {
            // アンケート結果をAPIに送信
            const response = await fetch('/api/results/survey-upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    answers,
                    totalQuestions: questions.length,
                    isAdult, // モード情報も送信
                    questions: questions.map(q => ({
                        id: q.id,
                        question: q.question
                    }))
                })
            })

            if (!response.ok) {
                const message = await response.text()
                throw new Error(message || 'アップロードに失敗しました。')
            }

            const data = await response.json()

            if (!data?.resultId) {
                throw new Error('結果IDを取得できませんでした。')
            }

            // カメラページに遷移
            router.push(`/camera/${data.resultId}`)
            onClose() // モーダルを閉じる
        } catch (err) {
            console.error(err)
            setUploadError(err instanceof Error ? err.message : '不明なエラーが発生しました。')
            setIsSubmitting(false)
        }
    }

    const currentQ = questions[currentQuestion]

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl w-full mx-4 bg-card border-2 border-firework-pink/30 firework-bg rounded-3xl shadow-2xl modal-transition">
                <DialogTitle className="sr-only">アンケート質問</DialogTitle>
                <div className="relative">
                    {/* モード表示バッジ */}
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className={`px-4 py-2 rounded-full text-sm font-bold ${isAdult
                            ? 'bg-gradient-to-r from-indigo-400 via-purple-500 to-blue-600 text-white'
                            : 'bg-gradient-to-r from-firework-pink to-firework-gold text-white'
                            }`}>
                            {isAdult ? '🎭 大人モード' : '🧸 キッズモード'}
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 text-firework-pink hover:text-firework-gold hover:bg-firework-pink/10 rounded-full cute-button"
                        onClick={onClose}
                    >
                        <X className="h-5 w-5" />
                    </Button>

                    {!showResultButton && !showFinalResult ? (
                        <div className="space-y-8 py-8 px-6 pt-12">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-white font-semibold flex items-center gap-2">
                                        <Star className="h-4 w-4" />
                                        質問 {currentQuestion + 1} / {questions.length}
                                    </span>
                                    <span className="text-white font-bold">{Math.round(progress)}%</span>
                                </div>
                                <Progress value={progress} className="h-3 bg-firework-navy/30 rounded-full overflow-hidden" />
                            </div>

                            <div className="text-center space-y-8">
                                <div className="relative">
                                    <h2 className="text-2xl md:text-3xl font-bold text-balance leading-relaxed text-white">
                                        {currentQ.question}
                                    </h2>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                                    {currentQ.options.map((option, index) => {
                                        const isSelected = selectedAnswer === index
                                        return (
                                            <Button
                                                key={index}
                                                onClick={() => handleAnswerSelect(index)}
                                                aria-selected={isSelected}
                                                className={`p-6 h-auto justify-center text-center transition-all duration-200 cute-button border-2 
          focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-firework-mint/30

          ${isSelected
                                                        /* 選択：黒背景＋カラフル文字（ボタンの文字色は透明にしない） */
                                                        ? "bg-black border-firework-gold hover:bg-black active:bg-black"
                                                        /* 未選択：白背景＋濃い文字、ホバーで少しだけ暗く＆枠を強調 */
                                                        : "bg-white text-gray-900 border-firework-mint/50 hover:bg-gradient-to-r hover:from-pink-100 hover:via-yellow-100 hover:to-lime-100  hover:text-gray-950 hover:border-firework-blue"
                                                    }`}
                                            >
                                                <span
                                                    className={`text-xl font-bold leading-snug
            ${isSelected
                                                            /* 選択時の文字：カラフルグラデーションで視認性UP（黒背景に映える） */
                                                            ? "text-transparent bg-clip-text bg-gradient-to-r from-firework-pink via-firework-gold to-firework-mint"
                                                            /* 未選択文字：濃いグレーで白背景でも読みやすい */
                                                            : "text-gray-900"
                                                        }`}
                                                >
                                                    {option}
                                                </span>
                                            </Button>
                                        )
                                    })}
                                </div>


                                <div className="pt-6">
                                    <Button
                                        onClick={handleNext}
                                        disabled={selectedAnswer === null}
                                        size="lg"
                                        className="px-10 py-4 cute-button bg-gradient-to-r from-firework-gold to-firework-pink hover:from-firework-pink hover:to-firework-purple text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {currentQuestion === questions.length - 1 ? "完了" : "次の質問 →"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : showResultButton && !showFinalResult ? (
                        <div className="space-y-8 py-16 text-center">
                            <div className="space-y-6">
                                <div className="text-6xl">🎉</div>
                                <h2 className="text-3xl md:text-4xl font-bold text-balance text-white">全質問回答完了！</h2>
                                <p className="text-xl text-white">お疲れさまでした！さぁどんなりんご飴ができているかな？</p>
                            </div>

                            <div className="pt-6">
                                <Button
                                    onClick={handleShowResult}
                                    size="lg"
                                    className="px-12 py-4 cute-button bg-gradient-to-r from-firework-gold to-firework-pink hover:from-firework-pink hover:to-firework-purple text-white font-bold text-xl"
                                >
                                    結果を見る🍭
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 py-12 text-center">
                            <div className="space-y-6">
                                <div className="text-6xl">🎊</div>
                                <h2 className="text-3xl md:text-4xl font-bold text-balance text-foreground">アンケート完了</h2>
                                <div className="text-8xl font-bold">
                                    <span className="bg-gradient-to-r from-firework-pink via-firework-gold to-firework-mint bg-clip-text text-transparent">
                                        {questions.length}
                                    </span>
                                    <span className="text-3xl text-muted-foreground">問</span>
                                </div>
                                <p className="text-2xl font-semibold text-firework-gold">
                                    {isAdult ? '大人モード' : 'キッズモード'}の全ての質問にお答えいただきありがとうございました
                                </p>

                                <div className="text-lg text-muted-foreground">
                                    🌟 あなたの貴重なご意見をお聞かせいただき、ありがとうございます！
                                </div>
                            </div>

                            {uploadError && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                    <p className="text-red-400">{uploadError}</p>
                                </div>
                            )}

                            <div className="flex flex-col gap-4 pt-6">
                                <Button
                                    onClick={handleSubmitResults}
                                    disabled={isSubmitting}
                                    size="lg"
                                    className="px-12 py-4 cute-button bg-gradient-to-r from-firework-blue to-firework-mint hover:from-firework-mint hover:to-firework-blue text-white font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? '📤 回答を送信中...' : '📤 回答を送信してカメラへ'}
                                </Button>

                                <Button
                                    onClick={onClose}
                                    variant="outline"
                                    size="lg"
                                    className="px-12 py-4 cute-button border-firework-gold/30 hover:bg-firework-gold/10 text-firework-gold font-bold text-lg"
                                >
                                    🏠 ホームに戻る
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}