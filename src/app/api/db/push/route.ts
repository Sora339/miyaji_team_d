import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    console.log('🚀 テーブル作成を開始します...')

    // ここでは手動でテーブルを作成します
    // 実運用では Prisma Migrate を使用してください
    
    // usersテーブル作成
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `)

    // hand_gesturesテーブル作成
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS hand_gestures (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        gesture_data TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
        is_processed BOOLEAN DEFAULT FALSE
      )
    `)

    // canvas_dataテーブル作成
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS canvas_data (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        canvas_state TEXT NOT NULL,
        title TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `)

    console.log('✅ テーブル作成完了')

    return NextResponse.json({ 
      success: true, 
      message: 'テーブルが正常に作成されました',
      tables: ['users', 'hand_gestures', 'canvas_data']
    })

  } catch (error) {
    console.error('❌ テーブル作成エラー:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
