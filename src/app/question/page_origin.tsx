'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function QuestionPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/results/test-upload', {
        method: 'POST',
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'アップロードに失敗しました。')
      }

      const data = await response.json()

      if (!data?.resultId) {
        throw new Error('結果IDを取得できませんでした。')
      }

      router.push(`/camera/${data.resultId}`)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました。')
      setIsSubmitting(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        padding: '2rem 1rem',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>回答送信テスト</h1>
      <p style={{ color: '#4b5563', textAlign: 'center' }}>
        ボタンを押すとサンプル画像をストレージとDBへ登録し、カメラ画面に移動します。
      </p>
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        style={{
          padding: '0.75rem 1.5rem',
          borderRadius: '9999px',
          border: 'none',
          backgroundColor: isSubmitting ? '#9ca3af' : '#ef4444',
          color: '#fff',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s ease',
        }}
      >
        {isSubmitting ? 'アップロード中…' : '回答を送信 (画像を生成してアップロード)'}
      </button>
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}
    </div>
  )
}
