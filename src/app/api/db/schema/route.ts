import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function GET() {
  try {
    console.log('🔍 Drizzle ORMを使用したスキーマテスト開始...')
    
    // テーブル存在確認
    const tablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'hand_gestures', 'canvas_data')
    `)
    
    console.log('📋 既存テーブル:', tablesResult)
    
    return NextResponse.json({
      success: true,
      tables: tablesResult,
      orm: 'Drizzle ORM'
    })
    
  } catch (error) {
    console.error('❌ Drizzle ORMスキーマテストエラー:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        orm: 'Drizzle ORM'
      },
      { status: 500 }
    )
  }
}