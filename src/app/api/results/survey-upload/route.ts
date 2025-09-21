// src/app/api/results/survey-upload/route.ts
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

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

        if (!answers.every(answerId => typeof answerId === 'number')) {
            return NextResponse.json(
                { error: 'Answers must contain option IDs as numbers' },
                { status: 400 }
            )
        }

        // 集計のために結果を保存
        const result = await prisma.results.create({
            data: {
                answers,
            },
            select: {
                id: true,
                answers: true,
            }
        })

        console.log('Survey results saved:', {
            resultId: result.id,
            totalQuestions,
            answersCount: answers.length,
            answers: result.answers,
            questions,
        })

        // 成功レスポンス
        return NextResponse.json({
            success: true,
            resultId: result.id,
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
