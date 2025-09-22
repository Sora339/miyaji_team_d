// src/app/api/results/survey-upload/route.ts
import { NextRequest, NextResponse } from 'next/server'

import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const APPLE_CANDY_BUCKET = 'apple-candy-images'
const LAYER_ORDER = ['base', 'whole', 'upper-half', 'shaft', 'lower', 'upper', 'center'] as const

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { resultId, answers, totalQuestions, questions, isAdult } = body

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

        if (typeof resultId !== 'number' || !Number.isFinite(resultId)) {
            return NextResponse.json(
                { error: 'Invalid result id' },
                { status: 400 }
            )
        }

        const resultRecord = await prisma.results.findUnique({
            where: { id: resultId },
            select: { id: true },
        })

        if (!resultRecord) {
            return NextResponse.json(
                { error: 'Result record not found' },
                { status: 404 }
            )
        }

        const modeFolder = isAdult ? 'adult' : 'child'
        const imageRoot = join(process.cwd(), 'public', 'image', modeFolder)

        const remainingAnswers = [...answers]
        const layerImages: string[] = []

        for (const layer of LAYER_ORDER) {
            const matchIndex = remainingAnswers.findIndex((id) => {
                const candidatePath = join(imageRoot, layer, `${id}.png`)
                return existsSync(candidatePath)
            })

            if (matchIndex !== -1) {
                const optionId = remainingAnswers.splice(matchIndex, 1)[0]
                const imagePath = join(imageRoot, layer, `${optionId}.png`)
                layerImages.push(imagePath)
            }
        }

        if (layerImages.length === 0) {
            return NextResponse.json(
                { error: '画像レイヤーを特定できませんでした。' },
                { status: 422 }
            )
        }

        let appleCandyUrl: string | null = null

        if (layerImages.length > 0) {
            const [baseImage, ...overlayImages] = layerImages

            const compositeBuffer = await sharp(baseImage)
                .png()
                .composite(overlayImages.map((imagePath) => ({ input: imagePath })))
                .png()
                .toBuffer()

            const filenameHash = createHash('sha1')
                .update(JSON.stringify({ answers, modeFolder, timestamp: Date.now() }))
                .digest('hex')

            const objectPath = `generated/${modeFolder}/${filenameHash}.png`

            const { error: uploadError } = await supabaseAdmin.storage
                .from(APPLE_CANDY_BUCKET)
                .upload(objectPath, compositeBuffer, {
                    cacheControl: '31536000',
                    contentType: 'image/png',
                    upsert: false,
                })

            if (uploadError) {
                throw new Error(`Failed to upload composite image: ${uploadError.message}`)
            }

            const { data: publicData } = supabaseAdmin.storage
                .from(APPLE_CANDY_BUCKET)
                .getPublicUrl(objectPath)

            appleCandyUrl = publicData?.publicUrl ?? null
        }

        // 集計のために結果を保存
        const result = await prisma.results.update({
            where: { id: resultId },
            data: {
                answers,
                appleCandyUrl,
            },
            select: {
                id: true,
                answers: true,
                appleCandyUrl: true,
            }
        })

        // 同じ組み合わせで作成済みの件数を集計 (appleCandyUrlが存在するもののみ)
        const sameCount = await prisma.results.count({
            where: {
                answers: { equals: result.answers },
                appleCandyUrl: { not: null },
            },
        })

        const pastCount = Math.max(0, sameCount - 1) // current を除いた過去の件数

        console.log('Survey results saved:', {
            resultId: result.id,
            totalQuestions,
            answersCount: answers.length,
            answers: result.answers,
            questions,
            appleCandyUrl: result.appleCandyUrl,
            sameCount,
            pastCount,
        })

        // 成功レスポンス（同じりんご飴を作った人数を含む）
        return NextResponse.json({
            success: true,
            resultId: result.id,
            appleCandyUrl: result.appleCandyUrl,
            sameCount,
            pastCount,
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
