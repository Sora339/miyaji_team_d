import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, handGestures, canvasData } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST() {
  try {
    console.log('🔍 Drizzle ORMを使用したテーブル作成テスト開始...')

    // テストデータを挿入してテーブルが正常に動作することを確認
    
    // 1. テストユーザーを作成
    const testUser = await db.insert(users).values({
      email: 'test@example.com',
      name: 'Test User'
    }).returning()
    
    console.log('✅ Usersテーブル作成・挿入成功:', testUser)

    // 2. テストハンドジェスチャーデータを作成
    const testGesture = await db.insert(handGestures).values({
      userId: testUser[0].id,
      gestureData: JSON.stringify({ landmarks: [], timestamp: new Date() }),
      isProcessed: false
    }).returning()
    
    console.log('✅ HandGesturesテーブル作成・挿入成功:', testGesture)

    // 3. テストキャンバスデータを作成
    const testCanvas = await db.insert(canvasData).values({
      userId: testUser[0].id,
      canvasState: JSON.stringify({ objects: [], background: 'white' }),
      title: 'Test Canvas'
    }).returning()
    
    console.log('✅ CanvasDataテーブル作成・挿入成功:', testCanvas)

    // 4. 作成したテストデータを削除（クリーンアップ）
    await db.delete(canvasData).where(eq(canvasData.id, testCanvas[0].id))
    await db.delete(handGestures).where(eq(handGestures.id, testGesture[0].id))
    await db.delete(users).where(eq(users.id, testUser[0].id))
    
    console.log('✅ テストデータクリーンアップ完了')

    return NextResponse.json({ 
      success: true, 
      message: 'Drizzle ORMを使用したテーブル操作テストが完了しました',
      testResults: {
        user: testUser[0],
        gesture: testGesture[0],
        canvas: testCanvas[0]
      },
      orm: 'Drizzle ORM'
    })

  } catch (error) {
    console.error('❌ Drizzle ORMテーブル操作エラー:', error)
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

export async function GET() {
  try {
    console.log('🔍 Drizzle ORMを使用したデータ取得テスト開始...')
    
    // 既存のデータを取得してテーブルが存在することを確認
    const userCount = await db.select().from(users)
    const gestureCount = await db.select().from(handGestures)
    const canvasCount = await db.select().from(canvasData)
    
    return NextResponse.json({
      success: true,
      message: 'Drizzle ORMでのデータ取得成功',
      counts: {
        users: userCount.length,
        handGestures: gestureCount.length,
        canvasData: canvasCount.length
      },
      orm: 'Drizzle ORM'
    })
    
  } catch (error) {
    console.error('❌ Drizzle ORMデータ取得エラー:', error)
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