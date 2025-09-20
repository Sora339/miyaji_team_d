// src/app/api/results/survey-upload/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { answers, totalQuestions, questions } = body

        // バリデーション
        if (!Array.isArray(answers) || typeof totalQuestions !== 'number') {
            return NextResponse.json(
                { error: 'Invalid request data' },
                { status: 400 }
            )
        }

        // ここで実際のDBへの保存処理やストレージへの保存を行う
        // 例: const resultId = await saveSurveyResults({ answers, totalQuestions, questions })

        // テスト用のサンプルデータ生成
        const resultId = `survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        console.log('Survey results saved:', {
            resultId,
            totalQuestions,
            answersCount: answers.length,
            answers
        })

        // 成功レスポンス
        return NextResponse.json({
            success: true,
            resultId,
            message: 'アンケート回答が正常に保存されました'
        })

    } catch (error) {
        console.error('Survey upload error:', error)
        return NextResponse.json(
            { error: 'アンケート回答の保存に失敗しました' },
            { status: 500 }
        )
    }
}