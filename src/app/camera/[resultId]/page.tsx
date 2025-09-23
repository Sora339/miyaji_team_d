"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";

type HandLandmarks = Array<{
  x: number;
  y: number;
  z: number;
  visibility?: number;
}>;

type FingerIndices = {
  tip: number;
  pip: number;
};

type HandsResults = {
  multiHandLandmarks?: HandLandmarks[];
};

interface HandsInstance {
  close(): Promise<void>;
  onResults(callback: (results: HandsResults) => void): void;
  send(input: { image: HTMLVideoElement }): Promise<void>;
  setOptions(options: {
    selfieMode?: boolean;
    maxNumHands?: number;
    modelComplexity?: number;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
  }): void;
}

type HandsConstructor = new (config?: {
  locateFile?: (path: string, prefix?: string) => string;
}) => HandsInstance;

const FINGER_PAIRS: FingerIndices[] = [
  { tip: 8, pip: 6 },
  { tip: 12, pip: 10 },
  { tip: 16, pip: 14 },
  { tip: 20, pip: 18 },
];

const HANDS_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/hands/";
const HAND_SCRIPT_SRC = `${HANDS_CDN}hands.js`;

let handsConstructorPromise: Promise<HandsConstructor | null> | null = null;

function loadHandsConstructor(): Promise<HandsConstructor | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.Hands) {
    return Promise.resolve(window.Hands);
  }

  if (!handsConstructorPromise) {
    handsConstructorPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        `script[src="${HAND_SCRIPT_SRC}"]`
      );
      if (existingScript) {
        existingScript.addEventListener("load", () =>
          resolve(window.Hands ?? null)
        );
        existingScript.addEventListener("error", () =>
          reject(new Error("Failed to load MediaPipe Hands script."))
        );
        return;
      }

      const script = document.createElement("script");
      script.src = HAND_SCRIPT_SRC;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.onload = () => resolve(window.Hands ?? null);
      script.onerror = () => {
        script.remove();
        handsConstructorPromise = null;
        reject(new Error("Failed to load MediaPipe Hands script."));
      };
      document.head.appendChild(script);
    });
  }

  return handsConstructorPromise;
}

declare global {
  interface Window {
    Hands?: HandsConstructor;
  }
}

function isFist(landmarks: HandLandmarks): boolean {
  if (landmarks.length < 21) return false;

  let curledFingers = 0;

  for (const { tip, pip } of FINGER_PAIRS) {
    const tipPoint = landmarks[tip];
    const pipPoint = landmarks[pip];
    const distance = Math.hypot(
      tipPoint.x - pipPoint.x,
      tipPoint.y - pipPoint.y
    );
    if (distance < 0.07) {
      curledFingers += 1;
    }
  }

  const thumbTip = landmarks[4];
  const thumbBase = landmarks[2];
  const thumbDistance = Math.hypot(
    thumbTip.x - thumbBase.x,
    thumbTip.y - thumbBase.y
  );
  const thumbCurled = thumbDistance < 0.08;

  return curledFingers >= 3 && thumbCurled;
}

function getHandCenter(landmarks: HandLandmarks) {
  const indices = [0, 5, 9, 13, 17];
  const sum = indices.reduce(
    (acc, index) => {
      const point = landmarks[index];
      acc.x += point.x;
      acc.y += point.y;
      return acc;
    },
    { x: 0, y: 0 }
  );

  return {
    x: sum.x / indices.length,
    y: sum.y / indices.length,
  };
}

function drawHand() {}

export default function CameraPage() {
  const params = useParams<{ resultId: string }>();
  const resultId = params?.resultId;
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayImageRef = useRef<HTMLImageElement | null>(null);
  const overlayReadyRef = useRef(false);
  const aspectRatioRef = useRef(16 / 9);
  const capturedBlobRef = useRef<Blob | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [overlayError, setOverlayError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [overlayReady, setOverlayReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureMessage, setCaptureMessage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState(16 / 9);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    overlayReadyRef.current = overlayReady;
  }, [overlayReady]);

  useEffect(() => {
    if (!resultId) {
      setOverlayError("結果IDが指定されていません。");
      return;
    }

    const controller = new AbortController();

    setOverlayError(null);
    setOverlayReady(false);
    overlayImageRef.current = null;

    (async () => {
      try {
        const response = await fetch(`/api/results/${resultId}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "結果の取得に失敗しました。");
        }

        const data = await response.json();
        const fallbackUrl = "/image/base/red_origin.png";
        const url: string = data?.result?.appleCandyUrl || fallbackUrl;

        if (controller.signal.aborted) return;

        const image = document.createElement("img");
        image.crossOrigin = "anonymous";
        image.onload = () => {
          if (controller.signal.aborted) return;
          overlayImageRef.current = image;
          setOverlayReady(true);
        };
        image.onerror = () => {
          if (controller.signal.aborted) return;
          setOverlayError("画像の読み込みに失敗しました。");
        };
        image.src = url;
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error(err);
        setOverlayError(
          err instanceof Error ? err.message : "画像情報の取得に失敗しました。"
        );
        // isOverlayLoadingRef.current = false;
      }
    })();

    return () => {
      controller.abort();
    };
  }, [resultId]);

  useEffect(() => {
    let active = true;
    let hands: HandsInstance | null = null;
    let animationFrame: number | null = null;
    let stream: MediaStream | null = null;

    const setup = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const HandsCtor = await loadHandsConstructor().catch((err) => {
        console.error(err);
        return null;
      });

      if (!HandsCtor) {
        if (active)
          setCameraError(
            "MediaPipe Hands を読み込めませんでした。ネットワーク設定を確認してください。"
          );
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
      } catch (err) {
        console.error("Failed to access camera", err);
        if (active)
          setCameraError(
            "カメラへアクセスできませんでした。ブラウザの設定を確認してください。"
          );
        return;
      }

      if (!active) return;

      const video = videoRef.current;
      video.srcObject = stream;
      await video.play().catch((err) => {
        console.error("Failed to play stream", err);
        if (active) setCameraError("カメラ映像を再生できませんでした。");
      });

      hands = new HandsCtor({
        locateFile: (file) => `${HANDS_CDN}${file}`,
      });

      hands.setOptions({
        selfieMode: false,
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5,
      });

      hands.onResults((results) => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        const currentVideo = videoRef.current;
        if (!canvas || !context || !currentVideo) return;

        const { videoWidth, videoHeight } = currentVideo;
        if (!videoWidth || !videoHeight) return;

        if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
          canvas.width = videoWidth;
          canvas.height = videoHeight;
        }

        if (videoWidth && videoHeight) {
          const nextAspect = videoWidth / videoHeight;
          if (
            Number.isFinite(nextAspect) &&
            Math.abs(aspectRatioRef.current - nextAspect) > 0.001
          ) {
            aspectRatioRef.current = nextAspect;
            setAspectRatio(nextAspect);
          }
        }

        context.save();
        context.clearRect(0, 0, canvas.width, canvas.height);

        const allLandmarks = results.multiHandLandmarks ?? [];

        for (const landmarks of allLandmarks) {
          drawHand();

          if (isFist(landmarks)) {
            const center = getHandCenter(landmarks);
            const posX = center.x * canvas.width;
            const posY = center.y * canvas.height;

            if (overlayReadyRef.current && overlayImageRef.current) {
              const overlayImg = overlayImageRef.current;

              const drawWidth = Math.max(canvas.width * 0.18, 1);
              const drawHeight = Math.max(canvas.height * 0.38, 1);

              context.save();
              context.translate(posX, posY - drawHeight * 0.74);
              context.drawImage(
                overlayImg,
                -drawWidth / 2,
                -drawHeight / 2,
                drawWidth,
                drawHeight
              );
              context.restore();
            }
          }
        }

        context.restore();
      });

      const processFrame = async () => {
        if (!active || !hands || !videoRef.current) return;
        try {
          await hands.send({ image: videoRef.current });
        } catch (err) {
          console.error("Failed to process frame", err);
        }
        animationFrame = requestAnimationFrame(processFrame);
      };

      setIsReady(true);
      processFrame();
    };

    setup();

    return () => {
      active = false;
      if (animationFrame) cancelAnimationFrame(animationFrame);
      if (hands) {
        hands
          .close()
          .catch((err) =>
            console.error("Failed to close MediaPipe Hands", err)
          );
      }
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <main className="py-16 min-h-screen bg-gradient-to-b from-[#110a2a] to-[#33446a]">
      <Image
        className="w-[710px] mx-auto"
        src="/image/og-image.png"
        alt="CANDY CAMERA."
        width={710}
        height={640}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "min(90vw, 720px)",
            aspectRatio,
            backgroundColor: "#000",
            borderRadius: "0.75rem",
            overflow: "hidden",
          }}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            alignItems: "center",
          }}
        >
          <Button
            onClick={async () => {
              if (isCapturing || isSavingPhoto) return;

              setCaptureMessage(null);

              if (!resultId) {
                setCaptureMessage("結果IDが不明なため保存できません。");
                return;
              }

              const video = videoRef.current;
              const overlayCanvas = canvasRef.current;

              if (!video || !overlayCanvas) {
                setCaptureMessage("カメラがまだ準備できていません。");
                return;
              }

              const { videoWidth, videoHeight } = video;
              if (!videoWidth || !videoHeight) {
                setCaptureMessage("カメラ映像が利用できません。");
                return;
              }

              const snapshotCanvas = document.createElement("canvas");
              snapshotCanvas.width = videoWidth;
              snapshotCanvas.height = videoHeight;
              const context = snapshotCanvas.getContext("2d");

              if (!context) {
                setCaptureMessage("画像の生成に失敗しました。");
                return;
              }

              context.drawImage(video, 0, 0, videoWidth, videoHeight);
              context.drawImage(overlayCanvas, 0, 0, videoWidth, videoHeight);

              setIsCapturing(true);

              snapshotCanvas.toBlob((blob) => {
                if (!blob) {
                  setCaptureMessage("画像の生成に失敗しました。");
                  setIsCapturing(false);
                  return;
                }

                if (previewUrl) {
                  URL.revokeObjectURL(previewUrl);
                }
                capturedBlobRef.current = blob;
                const url = URL.createObjectURL(blob);
                setPreviewUrl(url);
                setIsConfirmOpen(true);
                setIsCapturing(false);
              }, "image/png");
            }}
            disabled={
              isCapturing ||
              isSavingPhoto ||
              !!cameraError ||
              !!overlayError ||
              !isReady
            }
            className="               
                      overflow-hidden !rounded-full
                      text-[clamp(1.5rem,3vw,3rem)]   /* 大きめ文字 */
                      px-[clamp(2rem,6vw,5rem)]      /* 横幅広く */
                      py-[clamp(1rem,3vw,3rem)]       /* 縦幅も大きく */
                      font-extrabold
                      bg-gradient-to-r from-firework-pink to-firework-gold
                      hover:from-orange-300 hover:to-yellow-300
                      text-white shadow-2xl
                      ring-4 ring-white/20 ring-offset-2
                      transition
                      mt-4
                      text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCapturing ? "生成中…" : "写真を撮る"}
          </Button>
          {captureMessage && (
            <p
              style={{
                fontSize: "0.875rem",
                color: captureMessage.includes("失敗") ? "#dc2626" : "#059669",
              }}
            >
              {captureMessage}
            </p>
          )}
        </div>

        <Dialog
          open={isConfirmOpen}
          onOpenChange={(open) => {
            if (!open && !isSavingPhoto) {
              if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
              }
              capturedBlobRef.current = null;
              setPreviewUrl(null);
              setIsConfirmOpen(false);
            }
          }}
        >
          <DialogContent className="max-w-4xl w-full mx-4 bg-card border-2 border-firework-pink/30 firework-bg rounded-3xl shadow-2xl ">
            <DialogHeader>
              <DialogTitle className="text-3xl text-center py-2">
                この写真でよろしいですか？
              </DialogTitle>
            </DialogHeader>
            {previewUrl && (
              <div className="w-full overflow-hidden rounded-2xl border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="撮影した写真"
                  className="w-full h-auto"
                />
              </div>
            )}
            {captureMessage && captureMessage.includes("失敗") && (
              <p className="text-sm text-red-500">{captureMessage}</p>
            )}
            <DialogFooter className="mx-auto gap-12 py-4">
              <Button
                className="!rounded-full bg-firework-gold px-8 py-6 text-2xl font-semibold
                          bg-gradient-to-r from-firework-pink to-firework-gold
                          hover:from-orange-300 hover:to-pink-500
                          ring-4 ring-white/20 ring-offset-2 ring-offset-transparent
                          transition
                          disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={async () => {
                  if (isSavingPhoto || !capturedBlobRef.current || !resultId)
                    return;
                  setCaptureMessage(null);
                  setIsSavingPhoto(true);

                  try {
                    const formData = new FormData();
                    formData.append(
                      "file",
                      capturedBlobRef.current,
                      "photo.png"
                    );

                    const response = await fetch(
                      `/api/results/${resultId}/photo`,
                      {
                        method: "POST",
                        body: formData,
                      }
                    );

                    if (!response.ok) {
                      const message = await response.text();
                      throw new Error(message || "写真の保存に失敗しました。");
                    }

                    const data = await response.json();
                    if (!data?.photoUrl) {
                      throw new Error(
                        "保存された写真のURLを取得できませんでした。"
                      );
                    }

                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl);
                    }
                    capturedBlobRef.current = null;
                    setPreviewUrl(null);
                    setIsConfirmOpen(false);
                    setCaptureMessage("写真を保存しました。");
                    router.push(`/download/${resultId}`);
                  } catch (error) {
                    console.error(error);
                    setCaptureMessage(
                      error instanceof Error
                        ? error.message
                        : "写真の保存に失敗しました。"
                    );
                  } finally {
                    setIsSavingPhoto(false);
                  }
                }}
                disabled={isSavingPhoto}
              >
                {isSavingPhoto ? "保存中…" : "これでOK"}
              </Button>
              <Button
                className="!rounded-full bg-firework-gold px-8 py-6 text-2xl font-semibold 
                          bg-gradient-to-r from-indigo-400 via-purple-500 to-blue-600
                          hover:from-purple-500 hover:to-indigo-600
                          text-white shadow-xl
                          ring-4 ring-white/20 ring-offset-2 ring-offset-transparent
                          transition
                          disabled:opacity-50 disabled:cursor-not-allowed"
                variant="outline"
                onClick={() => {
                  if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                  }
                  capturedBlobRef.current = null;
                  setPreviewUrl(null);
                  setIsConfirmOpen(false);
                }}
                disabled={isSavingPhoto}
              >
                撮り直す
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
