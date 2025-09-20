import { supabase } from '@/lib/supabase'

export async function testSupabaseConnection() {
  try {
    console.log('🔍 Supabaseクライアント接続テスト開始...')
    
    // Supabaseクライアントの基本接続テスト
    const { error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Supabase接続エラー:', error)
      return { success: false, error }
    }
    
    console.log('✅ Supabaseクライアント接続成功')
    
    // データベース接続テスト（API経由）
    console.log('🔍 データベース接続テスト開始...')
    
    const response = await fetch('/api/db/test')
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'データベース接続エラー')
    }
    
    console.log('✅ データベース接続成功')
    console.log('📅 データベース現在時刻:', result.dbTime)
    
    return { 
      success: true, 
      message: 'すべての接続テストが成功しました',
      dbTime: result.dbTime
    }
    
  } catch (error) {
    console.error('❌ 接続テストエラー:', error)
    return { success: false, error }
  }
}

export async function testDatabaseSchema() {
  try {
    console.log('🔍 データベーススキーマテスト開始...')
    
    // テーブル存在確認（API経由）
    const response = await fetch('/api/db/schema')
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'スキーマテストエラー')
    }
    
    console.log('📋 既存テーブル:', result.tables)
    
    return {
      success: true,
      tables: result.tables
    }
    
  } catch (error) {
    console.error('❌ スキーマテストエラー:', error)
    return { success: false, error }
  }
}