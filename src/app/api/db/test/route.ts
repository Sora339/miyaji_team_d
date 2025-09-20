import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function GET() {
  try {
    console.log('🔍 Drizzle ORMを使用したデータベース接続テスト開始...')
    
    // Drizzleを使って現在時刻を取得
    const result = await db.execute(sql`SELECT NOW() as current_time`)
    
    console.log('✅ Drizzle ORM接続成功')
    console.log('📅 データベース現在時刻:', result)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Drizzle ORMでのデータベース接続成功',
      dbTime: result,
      orm: 'Drizzle ORM'
    })
    
  } catch (error) {
    console.error('❌ Drizzle ORM接続エラー:', error)
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