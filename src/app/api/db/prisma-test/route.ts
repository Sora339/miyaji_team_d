import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    console.log('🔍 Prisma を使用したテーブル操作テスト開始...')

    const uniqueSuffix = Date.now()

    const testUser = await prisma.user.create({
      data: {
        email: `test-${uniqueSuffix}@example.com`,
        name: 'Test User',
      },
    })

    console.log('✅ Users テーブル挿入成功:', testUser)

    const testGesture = await prisma.handGesture.create({
      data: {
        userId: testUser.id,
        gestureData: JSON.stringify({ landmarks: [], timestamp: new Date() }),
        isProcessed: false,
      },
    })

    console.log('✅ HandGestures テーブル挿入成功:', testGesture)

    const testCanvas = await prisma.canvasData.create({
      data: {
        userId: testUser.id,
        canvasState: JSON.stringify({ objects: [], background: 'white' }),
        title: 'Test Canvas',
      },
    })

    console.log('✅ CanvasData テーブル挿入成功:', testCanvas)

    await prisma.canvasData.delete({ where: { id: testCanvas.id } })
    await prisma.handGesture.delete({ where: { id: testGesture.id } })
    await prisma.user.delete({ where: { id: testUser.id } })

    console.log('✅ テストデータクリーンアップ完了')

    return NextResponse.json({
      success: true,
      message: 'Prisma を使用したテーブル操作テストが完了しました',
      testResults: {
        user: testUser,
        gesture: testGesture,
        canvas: testCanvas,
      },
      orm: 'Prisma',
    })
  } catch (error) {
    console.error('❌ Prisma テーブル操作エラー:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        orm: 'Prisma',
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    console.log('🔍 Prisma を使用したデータ取得テスト開始...')

    const userCount = await prisma.user.count()
    const gestureCount = await prisma.handGesture.count()
    const canvasCount = await prisma.canvasData.count()

    return NextResponse.json({
      success: true,
      message: 'Prisma でのデータ取得成功',
      counts: {
        users: userCount,
        handGestures: gestureCount,
        canvasData: canvasCount,
      },
      orm: 'Prisma',
    })
  } catch (error) {
    console.error('❌ Prisma データ取得エラー:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        orm: 'Prisma',
      },
      { status: 500 },
    )
  }
}
