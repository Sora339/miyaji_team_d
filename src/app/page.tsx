'use client'

import { Results } from '@mediapipe/hands'
import { Canvas } from 'fabric'

export default function Home() {
  const handleHandResults = (results: Results) => {
    // ハンド検出結果を処理
    if (results.multiHandLandmarks) {
      console.log('検出された手の数:', results.multiHandLandmarks.length)
    }
  }

  const handleCanvasChange = (canvas: Canvas) => {
    // キャンバスの変更を処理
    console.log('キャンバスが変更されました', canvas.getObjects().length)
  }

  return (
    <div className="min-h-screen p-8">
      <main className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          MediaPipe Hands + Fabric.js Demo
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        </div>
        
        <div className="mt-8 p-4 bg-gray-100 rounded">
          <h3 className="text-lg font-semibold mb-2">セットアップ状況</h3>
          <ul className="space-y-1 text-sm">
            <li>✅ Next.js (TypeScript)</li>
            <li>✅ Tailwind CSS</li>
            <li>✅ Supabase Client</li>
            <li>✅ Drizzle ORM</li>
            <li>✅ MediaPipe Hands</li>
            <li>✅ Fabric.js</li>
          </ul>
          <p className="mt-2 text-sm text-gray-600">
            環境変数(.env.local)にSupabaseの接続情報を設定してください。
          </p>
        </div>
      </main>
    </div>
  )
}
