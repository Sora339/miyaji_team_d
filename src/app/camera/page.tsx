'use client'

import { useEffect, useRef, useState } from 'react'

type HandLandmarks = Array<{ x: number; y: number; z: number; visibility?: number }>

type FingerIndices = {
  tip: number
  pip: number
}

type HandsResults = {
  multiHandLandmarks?: HandLandmarks[]
}

interface HandsInstance {
  close(): Promise<void>
  onResults(callback: (results: HandsResults) => void): void
  send(input: { image: HTMLVideoElement }): Promise<void>
  setOptions(options: {
    selfieMode?: boolean
    maxNumHands?: number
    modelComplexity?: number
    minDetectionConfidence?: number
    minTrackingConfidence?: number
  }): void
}

type HandsConstructor = new (config?: { locateFile?: (path: string, prefix?: string) => string }) => HandsInstance

const FINGER_PAIRS: FingerIndices[] = [
  { tip: 8, pip: 6 },
  { tip: 12, pip: 10 },
  { tip: 16, pip: 14 },
  { tip: 20, pip: 18 },
]

const HAND_CONNECTIONS: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [0, 17],
]

const HANDS_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/'
const HAND_SCRIPT_SRC = `${HANDS_CDN}hands.js`

let handsConstructorPromise: Promise<HandsConstructor | null> | null = null

function loadHandsConstructor(): Promise<HandsConstructor | null> {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (window.Hands) {
    return Promise.resolve(window.Hands)
  }

  if (!handsConstructorPromise) {
    handsConstructorPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${HAND_SCRIPT_SRC}"]`)
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(window.Hands ?? null))
        existingScript.addEventListener('error', () => reject(new Error('Failed to load MediaPipe Hands script.')))
        return
      }

      const script = document.createElement('script')
      script.src = HAND_SCRIPT_SRC
      script.async = true
      script.crossOrigin = 'anonymous'
      script.onload = () => resolve(window.Hands ?? null)
      script.onerror = () => {
        script.remove()
        handsConstructorPromise = null
        reject(new Error('Failed to load MediaPipe Hands script.'))
      }
      document.head.appendChild(script)
    })
  }

  return handsConstructorPromise
}

declare global {
  interface Window {
    Hands?: HandsConstructor
  }
}

function isFist(landmarks: HandLandmarks): boolean {
  if (landmarks.length < 21) return false

  let curledFingers = 0

  for (const { tip, pip } of FINGER_PAIRS) {
    const tipPoint = landmarks[tip]
    const pipPoint = landmarks[pip]
    const distance = Math.hypot(tipPoint.x - pipPoint.x, tipPoint.y - pipPoint.y)
    if (distance < 0.07) {
      curledFingers += 1
    }
  }

  const thumbTip = landmarks[4]
  const thumbBase = landmarks[2]
  const thumbDistance = Math.hypot(thumbTip.x - thumbBase.x, thumbTip.y - thumbBase.y)
  const thumbCurled = thumbDistance < 0.08

  return curledFingers >= 3 && thumbCurled
}

function getHandCenter(landmarks: HandLandmarks) {
  const indices = [0, 5, 9, 13, 17]
  const sum = indices.reduce(
    (acc, index) => {
      const point = landmarks[index]
      acc.x += point.x
      acc.y += point.y
      return acc
    },
    { x: 0, y: 0 }
  )

  return {
    x: sum.x / indices.length,
    y: sum.y / indices.length,
  }
}

function drawHand(context: CanvasRenderingContext2D, landmarks: HandLandmarks) {
  const { width, height } = context.canvas

  context.lineWidth = 3
  context.strokeStyle = '#22d3ee'
  context.lineJoin = 'round'
  context.lineCap = 'round'

  for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
    const start = landmarks[startIdx]
    const end = landmarks[endIdx]
    if (!start || !end) continue

    context.beginPath()
    context.moveTo(start.x * width, start.y * height)
    context.lineTo(end.x * width, end.y * height)
    context.stroke()
  }

  const radius = Math.max(3, Math.min(width, height) * 0.008)
  context.fillStyle = '#fbbf24'

  for (const point of landmarks) {
    context.beginPath()
    context.arc(point.x * width, point.y * height, radius, 0, Math.PI * 2)
    context.fill()
  }
}

export default function CameraPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [fistDetected, setFistDetected] = useState(false)

  useEffect(() => {
    let active = true
    let hands: HandsInstance | null = null
    let animationFrame: number | null = null
    let stream: MediaStream | null = null

    const setup = async () => {
      if (!videoRef.current || !canvasRef.current) return

      const HandsCtor = await loadHandsConstructor().catch((err) => {
        console.error(err)
        return null
      })

      if (!HandsCtor) {
        if (active) setError('MediaPipe Hands を読み込めませんでした。ネットワーク設定を確認してください。')
        return
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      } catch (err) {
        console.error('Failed to access camera', err)
        if (active) setError('カメラへアクセスできませんでした。ブラウザの設定を確認してください。')
        return
      }

      if (!active) return

      const video = videoRef.current
      video.srcObject = stream
      await video.play().catch((err) => {
        console.error('Failed to play stream', err)
        if (active) setError('カメラ映像を再生できませんでした。')
      })

      hands = new HandsCtor({
        locateFile: (file) => `${HANDS_CDN}${file}`,
      })

      hands.setOptions({
        selfieMode: false,
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5,
      })

      hands.onResults((results) => {
        const canvas = canvasRef.current
        const context = canvas?.getContext('2d')
        const currentVideo = videoRef.current
        if (!canvas || !context || !currentVideo) return

        const { videoWidth, videoHeight } = currentVideo
        if (!videoWidth || !videoHeight) return

        if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
          canvas.width = videoWidth
          canvas.height = videoHeight
        }

        context.save()
        context.clearRect(0, 0, canvas.width, canvas.height)

        const landmarks = results.multiHandLandmarks?.[0]
        if (landmarks) {
          drawHand(context, landmarks)

          const fist = isFist(landmarks)
          if (fist) {
            const center = getHandCenter(landmarks)
            const posX = center.x * canvas.width
            const posY = center.y * canvas.height

            context.beginPath()
            context.arc(posX, posY, Math.max(canvas.width, canvas.height) * 0.04, 0, Math.PI * 2)
            context.fillStyle = 'rgba(220, 38, 38, 0.7)'
            context.fill()
          }

          setFistDetected((prev) => (prev === fist ? prev : fist))
        } else {
          setFistDetected((prev) => (prev ? false : prev))
        }

        context.restore()
      })

      const processFrame = async () => {
        if (!active || !hands || !videoRef.current) return
        try {
          await hands.send({ image: videoRef.current })
        } catch (err) {
          console.error('Failed to process frame', err)
        }
        animationFrame = requestAnimationFrame(processFrame)
      }

      setIsReady(true)
      processFrame()
    }

    setup()

    return () => {
      active = false
      if (animationFrame) cancelAnimationFrame(animationFrame)
      if (hands) {
        hands
          .close()
          .catch((err) => console.error('Failed to close MediaPipe Hands', err))
      }
      if (stream) stream.getTracks().forEach((track) => track.stop())
    }
  }, [])

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
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>カメラ実験ページ</h1>
      <p style={{ color: '#4b5563', textAlign: 'center' }}>
        カメラへのアクセスを許可し、手を握ると検知位置に赤い丸が表示されます。
      </p>
      <div
        style={{
          position: 'relative',
          width: 'min(90vw, 720px)',
          aspectRatio: '16 / 9',
          backgroundColor: '#000',
          borderRadius: '0.75rem',
          overflow: 'hidden',
        }}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        />
      </div>
      <div>
        {error && (
          <p style={{ color: '#dc2626' }}>{error}</p>
        )}
        {!error && (
          <p style={{ color: fistDetected ? '#dc2626' : '#059669', fontWeight: 600 }}>
            {isReady ? (fistDetected ? '握りこぶしを検知しました' : '手を握って検知を試してください') : 'カメラを起動しています…'}
          </p>
        )}
      </div>
    </div>
  )
}
