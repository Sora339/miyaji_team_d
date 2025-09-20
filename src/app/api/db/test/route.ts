import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('🔍 Prisma を使用したデータベース接続テスト開始...')

    const result = await prisma.$queryRaw<{ current_time: Date }>`SELECT NOW() as current_time`

    console.log('✅ Prisma 接続成功')
    console.log('📅 データベース現在時刻:', result)

    return NextResponse.json({ 
      success: true, 
      message: 'Prisma でのデータベース接続成功',
      dbTime: result,
      orm: 'Prisma'
    })
    
  } catch (error) {
    console.error('❌ Prisma 接続エラー:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        orm: 'Prisma'
      },
      { status: 500 }
    )
  }
}
