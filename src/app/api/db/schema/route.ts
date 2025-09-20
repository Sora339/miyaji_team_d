import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('🔍 Prisma を使用したスキーマテスト開始...')

    const tablesResult = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('users', 'hand_gestures', 'canvas_data')
    `

    console.log('📋 既存テーブル:', tablesResult)
    
    return NextResponse.json({
      success: true,
      tables: tablesResult,
      orm: 'Prisma'
    })
    
  } catch (error) {
    console.error('❌ Prisma スキーマテストエラー:', error)
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
