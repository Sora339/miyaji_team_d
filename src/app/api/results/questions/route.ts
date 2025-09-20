// src/app/api/questions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const isAdult = searchParams.get('isAdult') === 'true'

        // データベースから質問とオプションを取得
        const questions = await prisma.questions.findMany({
            where: {
                isAdult: isAdult
            },
            include: {
                options: {
                    orderBy: {
                        id: 'asc'
                    }
                }
            },
            orderBy: {
                id: 'asc'
            }
        })

        // フロントエンド用の形式に変換
        const formattedQuestions = questions.map(question => ({
            id: question.id,
            question: question.content,
            options: question.options.map(option => option.content)
        }))

        return NextResponse.json({
            success: true,
            questions: formattedQuestions
        })

    } catch (error) {
        console.error('Questions fetch error:', error)
        return NextResponse.json(
            { error: '質問の取得に失敗しました' },
            { status: 500 }
        )
    } finally {
        await prisma.$disconnect()
    }
}