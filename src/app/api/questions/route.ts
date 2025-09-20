import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        // URLからクエリパラメータを取得
        const { searchParams } = new URL(request.url)
        const isAdult = searchParams.get('isAdult') === 'true'

        console.log('Fetching questions with isAdult:', isAdult)

        // 質問をデータベースから取得
        const questions = await prisma.questions.findMany({
            include: {
                options: true
            }
        })

        console.log('Found questions:', questions)

        if (!questions || questions.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'No questions found'
            }, { status: 404 })
        }

        // レスポンスデータを整形
        const formattedQuestions = questions.map(q => ({
            id: q.id,
            question: q.content,
            options: q.options.map(o => o.content)
        }))

        console.log('Formatted questions:', formattedQuestions)

        return NextResponse.json({
            success: true,
            questions: formattedQuestions
        }, {
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            }
        })

    } catch (error) {
        console.error('Failed to fetch questions:', error)
        
        // エラーの詳細情報を返す
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        const errorDetails = error instanceof Error ? error.stack : ''
        
        return NextResponse.json({
            success: false,
            error: errorMessage,
            details: errorDetails
        }, { status: 500 })
    }
}