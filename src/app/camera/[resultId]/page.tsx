'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'

type HandLandmarks = Array<{ x: number; y: number; z: number; visibility?: number }>

type FingerIndices = {
  tip: number
  pip: number
}

type HandsResults = {
  multiHandmarks?: HandLandmarks[]
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

function drawHandOutline(context: CanvasRenderingContext2D, landmarks: HandLandmarks, canvasWidth: number, canvasHeight: number) {
  if (landmarks.length < 21) return;

  const connections = [
    [0, 1], [1, 2], [2, 3], [3, 4], // 親指
    [0, 5], [5, 6], [6, 7], [7, 8], // 人差し指
    [9, 10], [10, 11], [11, 12], // 中指
    [13, 14], [14, 15], [15, 16], // 薬指
    [0, 17], [17, 18], [18, 19], [19, 20], // 小指
    [5, 9], [9, 13], [13, 17], // 手のひら
  ];

  context.beginPath();
  
  // 各接続ポイントを結ぶ
  for (const [start, end] of connections) {
    context.moveTo(landmarks[start].x * canvasWidth, landmarks[start].y * canvasHeight);
    context.lineTo(landmarks[end].x * canvasWidth, landmarks[end].y * canvasHeight);
  }
  
  context.closePath();
}

export default function CameraPage() {
  const params = useParams<{ resultId: string }>()
  const resultId = params?.resultId

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const overlayImageRef = useRef<HTMLImageElement | null>(null)
  const backgroundImageRef = useRef<HTMLImageElement | null>(null)
  const overlayReadyRef = useRef(false)
  const backgroundReadyRef = useRef(false)
  const aspectRatioRef = useRef(16 / 9)

  const [cameraError, setCameraError] = useState<string | null>(null)
  const [overlayError, setOverlayError] = useState<string | null>(null)
  const [backgroundError, setBackgroundError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isOverlayLoading, setIsOverlayLoading] = useState(true)
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(true)
  const [overlayReady, setOverlayReady] = useState(false)
  const [backgroundReady, setBackgroundReady] = useState(false)
  const [overlayUrl, setOverlayUrl] = useState<string | null>(null)
  const [fistCount, setFistCount] = useState(0)
  const [isCapturing, setIsCapturing] = useState(false)
  const [captureMessage, setCaptureMessage] = useState<string | null>(null)
  const [aspectRatio, setAspectRatio] = useState(16 / 9)

  useEffect(() => {
    overlayReadyRef.current = overlayReady
  }, [overlayReady])

  useEffect(() => {
    backgroundReadyRef.current = backgroundReady
  }, [backgroundReady])

  useEffect(() => {
    if (!resultId) {
      setOverlayError('結果IDが指定されていません。')
      setIsOverlayLoading(false)
      return
    }

    const controller = new AbortController()

    setOverlayError(null)
    setOverlayReady(false)
    setOverlayUrl(null)
    overlayImageRef.current = null
    setIsOverlayLoading(true)

    ;(async () => {
      try {
        const response = await fetch(`/api/results/${resultId}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          const message = await response.text()
          throw new Error(message || '結果の取得に失敗しました。')
        }

        const data = await response.json()
        const fallbackUrl = '/image/base/red_origin.png'
        const url: string = data?.result?.appleCandyUrl || fallbackUrl

        if (controller.signal.aborted) return

        setOverlayUrl(url)

        const image = new Image()
        image.crossOrigin = 'anonymous'
        image.onload = () => {
          if (controller.signal.aborted) return
          overlayImageRef.current = image
          setOverlayReady(true)
          setIsOverlayLoading(false)
        }
        image.onerror = () => {
          if (controller.signal.aborted) return
          setOverlayError('画像の読み込みに失敗しました。')
          setIsOverlayLoading(false)
        }
        image.src = url
      } catch (err) {
        if (controller.signal.aborted) return
        console.error(err)
        setOverlayError(err instanceof Error ? err.message : '画像情報の取得に失敗しました。')
        setIsOverlayLoading(false)
      }
    })()

    return () => {
      controller.abort()
    }
  }, [resultId])

  useEffect(() => {
    const fireworkImageUrl = '/image/カメラの背景.jpg'
    const controller = new AbortController()

    setBackgroundError(null)
    setBackgroundReady(false)
    backgroundImageRef.current = null
    setIsBackgroundLoading(true)

    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      if (controller.signal.aborted) return
      backgroundImageRef.current = image
      setBackgroundReady(true)
      setIsBackgroundLoading(false)
    }
    image.onerror = () => {
      if (controller.signal.aborted) return
      setBackgroundError('背景画像の読み込みに失敗しました。')
      setIsBackgroundLoading(false)
    }
    image.src = fireworkImageUrl

    return () => {
      controller.abort()
    }
  }, [])

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
        if (active) setCameraError('MediaPipe Hands を読み込めませんでした。ネットワーク設定を確認してください。')
        return
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      } catch (err) {
        console.error('Failed to access camera', err)
        if (active) setCameraError('カメラへアクセスできませんでした。ブラウザの設定を確認してください。')
        return
      }

      if (!active) return

      const video = videoRef.current
      video.srcObject = stream
      await video.play().catch((err) => {
        console.error('Failed to play stream', err)
        if (active) setCameraError('カメラ映像を再生できませんでした。')
      })

      hands = new HandsCtor({
        locateFile: (file) => `${HANDS_CDN}${file}`,
      })

      hands.setOptions({
        selfieMode: false,
        maxNumHands: 2,
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

        if (videoWidth && videoHeight) {
          const nextAspect = videoWidth / videoHeight
          if (Number.isFinite(nextAspect) && Math.abs(aspectRatioRef.current - nextAspect) > 0.001) {
            aspectRatioRef.current = nextAspect
            setAspectRatio(nextAspect)
          }
        }

        context.save()
        context.clearRect(0, 0, canvas.width, canvas.height)

        if (backgroundReadyRef.current && backgroundImageRef.current) {
          const backgroundImg = backgroundImageRef.current
          context.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height)
        } else {
          context.fillStyle = '#000'
          context.fillRect(0, 0, canvas.width, canvas.height)
        }

        const allLandmarks = results.multiHandLandmarks ?? []
        
        context.save()
        for (const landmarks of allLandmarks) {
          if (landmarks.length > 0) {
            drawHandOutline(context, landmarks, canvas.width, canvas.height);
          }
        }
        context.clip()

        context.drawImage(currentVideo, 0, 0, canvas.width, canvas.height)
        
        context.restore()

        let detectedFists = 0

        for (const landmarks of allLandmarks) {
          if (isFist(landmarks)) {
            detectedFists += 1
            const center = getHandCenter(landmarks)
            const posX = center.x * canvas.width
            const posY = center.y * canvas.height

            if (overlayReadyRef.current && overlayImageRef.current) {
              const overlayImg = overlayImageRef.current

              const drawWidth = Math.max(canvas.width * 0.18, 1)
              const drawHeight = Math.max(canvas.height * 0.38, 1)

              context.save()
              context.translate(posX, posY - drawHeight * 0.74)
              context.drawImage(overlayImg, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)
              context.restore()
            }
          }
        }

        setFistCount((prev) => (prev === detectedFists ? prev : detectedFists))

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
  }, [backgroundReady, overlayReady])

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
        カメラへのアクセスを許可し、手を握ると保存された画像が手の位置に表示されます。
      </p>
      <div
        style={{
          position: 'relative',
          width: 'min(90vw, 720px)',
          aspectRatio,
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
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'none',
          }}
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
        {cameraError && <p style={{ color: '#dc2626' }}>{cameraError}</p>}
        {overlayError && <p style={{ color: '#dc2626' }}>{overlayError}</p>}
        {backgroundError && <p style={{ color: '#dc2626' }}>{backgroundError}</p>}
        {!cameraError && !overlayError && !backgroundError && (
          <p style={{ color: fistCount > 0 ? '#dc2626' : '#059669', fontWeight: 600 }}>
            {isReady && overlayReady && backgroundReady
              ? fistCount > 0
                ? `握りこぶしを${fistCount}つ検知しました`
                : '手を握ると画像が表示されます'
              : isOverlayLoading || isBackgroundLoading
                ? '画像を読み込んでいます…'
                : 'カメラを起動しています…'}
          </p>
        )}
        {overlayUrl && overlayReady && (
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>表示中の画像: {overlayUrl}</p>
        )}
        <button
          onClick={async () => {
            if (isCapturing) return

            setCaptureMessage(null)

            if (!resultId) {
              setCaptureMessage('結果IDが不明なため保存できません。')
              return
            }

            const video = videoRef.current
            const overlayCanvas = canvasRef.current

            if (!video || !overlayCanvas) {
              setCaptureMessage('カメラがまだ準備できていません。')
              return
            }

            const { videoWidth, videoHeight } = video
            if (!videoWidth || !videoHeight) {
              setCaptureMessage('カメラ映像が利用できません。')
              return
            }

            const snapshotCanvas = document.createElement('canvas')
            snapshotCanvas.width = videoWidth
            snapshotCanvas.height = videoHeight
            const context = snapshotCanvas.getContext('2d')

            if (!context) {
              setCaptureMessage('画像の生成に失敗しました。')
              return
            }
            
            context.drawImage(overlayCanvas, 0, 0, videoWidth, videoHeight)

            setIsCapturing(true)

            snapshotCanvas.toBlob(async (blob) => {
              if (!blob) {
                setCaptureMessage('画像の生成に失敗しました。')
                setIsCapturing(false)
                return
              }

              try {
                const formData = new FormData()
                formData.append('file', blob, 'photo.png')

                const response = await fetch(`/api/results/${resultId}/photo`, {
                  method: 'POST',
                  body: formData,
                })

                if (!response.ok) {
                  const message = await response.text()
                  throw new Error(message || '写真の保存に失敗しました。')
                }

                await response.json()
                setCaptureMessage('写真を保存しました。')
              } catch (error) {
                console.error(error)
                setCaptureMessage(error instanceof Error ? error.message : '写真の保存に失敗しました。')
              } finally {
                setIsCapturing(false)
              }
            }, 'image/png')
          }}
          disabled={isCapturing || !!cameraError || !!overlayError || !!backgroundError || !isReady || !backgroundReady}
          style={{
            marginTop: '0.5rem',
            padding: '0.75rem 1.5rem',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: isCapturing || cameraError || overlayError || backgroundError || !isReady || !backgroundReady ? '#9ca3af' : '#2563eb',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: isCapturing || cameraError || overlayError || backgroundError || !isReady || !backgroundReady ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease',
          }}
        >
          {isCapturing ? '保存中…' : '写真を撮る'}
        </button>
        {captureMessage && (
          <p style={{ fontSize: '0.875rem', color: captureMessage.includes('失敗') ? '#dc2626' : '#059669' }}>
            {captureMessage}
          </p>
        )}
      </div>
    </div>
  )
}