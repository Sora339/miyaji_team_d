"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

type SelfieSegmentationResults = {
  segmentationMask?: CanvasImageSource;
};

interface SelfieSegmentationInstance {
  close(): Promise<void>;
  onResults(callback: (results: SelfieSegmentationResults) => void): void;
  send(input: { image: HTMLVideoElement }): Promise<void>;
  setOptions(options: { selfieMode?: boolean; modelSelection?: 0 | 1 }): void;
}

type SelfieSegmentationConstructor = new (config?: {
  locateFile?: (path: string, prefix?: string) => string;
}) => SelfieSegmentationInstance;

const FINGER_PAIRS: FingerIndices[] = [
  { tip: 8, pip: 6 },
  { tip: 12, pip: 10 },
  { tip: 16, pip: 14 },
  { tip: 20, pip: 18 },
];

const HANDS_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/hands/";
const HAND_SCRIPT_SRC = `${HANDS_CDN}hands.js`;

const SEGMENTATION_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/";
const SEGMENTATION_SCRIPT_SRC = `${SEGMENTATION_CDN}selfie_segmentation.js`;

let handsConstructorPromise: Promise<HandsConstructor | null> | null = null;
let selfieSegmentationConstructorPromise:
  | Promise<SelfieSegmentationConstructor | null>
  | null = null;

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

function loadSelfieSegmentationConstructor(): Promise<
  SelfieSegmentationConstructor | null
> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.SelfieSegmentation) {
    return Promise.resolve(window.SelfieSegmentation);
  }

  if (!selfieSegmentationConstructorPromise) {
    selfieSegmentationConstructorPromise = new Promise(
      (resolve, reject) => {
        const existingScript = document.querySelector<HTMLScriptElement>(
          `script[src="${SEGMENTATION_SCRIPT_SRC}"]`
        );

        if (existingScript) {
          existingScript.addEventListener("load", () =>
            resolve(window.SelfieSegmentation ?? null)
          );
          existingScript.addEventListener("error", () =>
            reject(
              new Error(
                "Failed to load MediaPipe Selfie Segmentation script."
              )
            )
          );
          return;
        }

        const script = document.createElement("script");
        script.src = SEGMENTATION_SCRIPT_SRC;
        script.async = true;
        script.crossOrigin = "anonymous";
        script.onload = () => resolve(window.SelfieSegmentation ?? null);
        script.onerror = () => {
          script.remove();
          selfieSegmentationConstructorPromise = null;
          reject(
            new Error("Failed to load MediaPipe Selfie Segmentation script.")
          );
        };
        document.head.appendChild(script);
      }
    );
  }

  return selfieSegmentationConstructorPromise;
}

declare global {
  interface Window {
    Hands?: HandsConstructor;
    SelfieSegmentation?: SelfieSegmentationConstructor;
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

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default function CameraPage() {
  const params = useParams<{ resultId: string }>();
  const resultId = params?.resultId;
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const personCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayImageRef = useRef<HTMLImageElement | null>(null);
  const overlayReadyRef = useRef(false);
  const aspectRatioRef = useRef(16 / 9);
  const capturedBlobRef = useRef<Blob | null>(null);
  const latestHandLandmarksRef = useRef<HandLandmarks[]>([]);
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const backgroundReadyRef = useRef(false);
  const serviceLogoImageRef = useRef<HTMLImageElement | null>(null);
  const serviceLogoReadyRef = useRef(false);
  const createrLogoImageRef = useRef<HTMLImageElement | null>(null);
  const createrLogoReadyRef = useRef(false);

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
  const [backgroundReady, setBackgroundReady] = useState(false);
  const [backgroundError, setBackgroundError] = useState<string | null>(null);
  const [serviceLogoReady, setServiceLogoReady] = useState(false);
  const [createrLogoReady, setCreaterLogoReady] = useState(false);
  const [decorationError, setDecorationError] = useState<string | null>(null);

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date()),
    []
  );

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
    backgroundReadyRef.current = backgroundReady;
  }, [backgroundReady]);

  useEffect(() => {
    serviceLogoReadyRef.current = serviceLogoReady;
  }, [serviceLogoReady]);

  useEffect(() => {
    createrLogoReadyRef.current = createrLogoReady;
  }, [createrLogoReady]);

  useEffect(() => {
    setBackgroundError(null);
    setBackgroundReady(false);

    const image = document.createElement("img");
    image.onload = () => {
      backgroundImageRef.current = image;
      setBackgroundReady(true);
    };
    image.onerror = () => {
      backgroundImageRef.current = null;
      setBackgroundReady(false);
      setBackgroundError("背景画像の読み込みに失敗しました。");
    };
    image.src = "/image/purikura-background/4.webp";

    return () => {
      backgroundImageRef.current = null;
      setBackgroundReady(false);
    };
  }, [todayLabel]);

  useEffect(() => {
    let isMounted = true;
    setDecorationError(null);
    setServiceLogoReady(false);
    setCreaterLogoReady(false);

    const handleError = () => {
      if (!isMounted) return;
      setDecorationError("ロゴ画像の読み込みに失敗しました。");
    };

    const serviceImg = document.createElement("img");
    serviceImg.onload = () => {
      if (!isMounted) return;
      serviceLogoImageRef.current = serviceImg;
      setServiceLogoReady(true);
    };
    serviceImg.onerror = handleError;
    serviceImg.src = "/image/service-logo.webp";

    const createrImg = document.createElement("img");
    createrImg.onload = () => {
      if (!isMounted) return;
      createrLogoImageRef.current = createrImg;
      setCreaterLogoReady(true);
    };
    createrImg.onerror = handleError;
    createrImg.src = "/image/creater-logo.webp";

    return () => {
      isMounted = false;
      serviceLogoImageRef.current = null;
      createrLogoImageRef.current = null;
      setServiceLogoReady(false);
      setCreaterLogoReady(false);
    };
  }, [todayLabel]);

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
    let selfieSegmentation: SelfieSegmentationInstance | null = null;
    let animationFrame: number | null = null;
    let stream: MediaStream | null = null;

    const setup = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const [HandsCtor, SegmentationCtor] = await Promise.all([
        loadHandsConstructor().catch((err) => {
          console.error(err);
          return null;
        }),
        loadSelfieSegmentationConstructor().catch((err) => {
          console.error(err);
          return null;
        }),
      ]);

      if (!HandsCtor || !SegmentationCtor) {
        if (active)
          setCameraError(
            "カメラ処理モジュールを読み込めませんでした。ネットワーク設定を確認してください。"
          );
        return;
      }

      if (active) {
        setCameraError(null);
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

      if (!active) return;

      hands = new HandsCtor({
        locateFile: (file) => `${HANDS_CDN}${file}`,
      });

      selfieSegmentation = new SegmentationCtor({
        locateFile: (file) => `${SEGMENTATION_CDN}${file}`,
      });

      hands.setOptions({
        selfieMode: false,
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5,
      });

      selfieSegmentation.setOptions({
        selfieMode: false,
        modelSelection: 1,
      });

      hands.onResults((results) => {
        latestHandLandmarksRef.current = results.multiHandLandmarks ?? [];
      });

      selfieSegmentation.onResults((results) => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        const currentVideo = videoRef.current;
        if (!canvas || !context || !currentVideo) return;

        const { videoWidth, videoHeight } = currentVideo;
        if (!videoWidth || !videoHeight) return;

        let personCanvas = personCanvasRef.current;
        if (!personCanvas) {
          personCanvas = document.createElement("canvas");
          personCanvasRef.current = personCanvas;
        }

        if (
          personCanvas.width !== videoWidth ||
          personCanvas.height !== videoHeight
        ) {
          personCanvas.width = videoWidth;
          personCanvas.height = videoHeight;
        }

        const personContext = personCanvas.getContext("2d");
        if (!personContext) return;

        personContext.save();
        personContext.clearRect(0, 0, personCanvas.width, personCanvas.height);
        personContext.drawImage(
          currentVideo,
          0,
          0,
          personCanvas.width,
          personCanvas.height
        );
        if (results.segmentationMask) {
          personContext.globalCompositeOperation = "destination-in";
          personContext.drawImage(
            results.segmentationMask,
            0,
            0,
            personCanvas.width,
            personCanvas.height
          );
        }
        personContext.restore();

        const contentWidth = personCanvas.width;
        const contentHeight = personCanvas.height;

        const framePaddingX = Math.round(contentWidth * 0.05);
        const framePaddingTop = Math.round(contentHeight * 0.065);
        const framePaddingBottom = Math.round(contentHeight * 0.18);

        const targetCanvasWidth = contentWidth + framePaddingX * 2;
        const targetCanvasHeight =
          contentHeight + framePaddingTop + framePaddingBottom;

        if (
          canvas.width !== targetCanvasWidth ||
          canvas.height !== targetCanvasHeight
        ) {
          canvas.width = targetCanvasWidth;
          canvas.height = targetCanvasHeight;
        }

        const nextAspect = targetCanvasWidth / targetCanvasHeight;
        if (
          Number.isFinite(nextAspect) &&
          Math.abs(aspectRatioRef.current - nextAspect) > 0.001
        ) {
          aspectRatioRef.current = nextAspect;
          setAspectRatio(nextAspect);
        }

        context.save();
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#fff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        const contentX = framePaddingX;
        const contentY = framePaddingTop;
        const contentRadius = Math.min(contentWidth, contentHeight) * 0.045;

        context.save();
        drawRoundedRect(
          context,
          contentX,
          contentY,
          contentWidth,
          contentHeight,
          contentRadius
        );
        context.clip();

        if (backgroundReadyRef.current && backgroundImageRef.current) {
          context.drawImage(
            backgroundImageRef.current,
            contentX,
            contentY,
            contentWidth,
            contentHeight
          );
        } else {
          context.fillStyle = "#000";
          context.fillRect(contentX, contentY, contentWidth, contentHeight);
        }

        const allLandmarks = latestHandLandmarksRef.current;
        if (overlayReadyRef.current && overlayImageRef.current) {
          const overlayImg = overlayImageRef.current;
          for (const landmarks of allLandmarks) {
            drawHand();
            if (!isFist(landmarks)) continue;

            const center = getHandCenter(landmarks);
            const posX = contentX + center.x * contentWidth;
            const posY = contentY + center.y * contentHeight;

            const candyWidth = Math.max(contentWidth * 0.18, 1);
            const candyHeight = Math.max(contentHeight * 0.38, 1);

            context.save();
            context.translate(posX, posY - candyHeight * 0.74);
            context.drawImage(
              overlayImg,
              -candyWidth / 2,
              -candyHeight / 2,
              candyWidth,
              candyHeight
            );
            context.restore();
          }
        }

        context.drawImage(
          personCanvas,
          contentX,
          contentY,
          contentWidth,
          contentHeight
        );
        context.restore();

        const bottomAreaTop = contentY + contentHeight;
        const bottomAreaHeight = Math.max(canvas.height - bottomAreaTop, 0);
        if (bottomAreaHeight > 0) {
          const infoPadding = Math.round(bottomAreaHeight * 0.2);
          const infoTop = bottomAreaTop + infoPadding;
          const infoBottom = canvas.height - infoPadding;
          const infoHeight = Math.max(infoBottom - infoTop, 1);

          const serviceLogo =
            serviceLogoReadyRef.current && serviceLogoImageRef.current
              ? serviceLogoImageRef.current
              : null;
          if (serviceLogo) {
            const maxLogoWidth = contentWidth * 0.25;
            const maxLogoHeight = infoHeight;
            const scale = Math.min(
              maxLogoWidth / serviceLogo.naturalWidth,
              maxLogoHeight / serviceLogo.naturalHeight,
              1
            );
            const drawWidth = serviceLogo.naturalWidth * scale;
            const drawHeight = serviceLogo.naturalHeight * scale;
            const logoX = contentX;
            const logoY = infoTop + (infoHeight - drawHeight) / 2;
            context.drawImage(serviceLogo, logoX, logoY, drawWidth, drawHeight);
          }

          const dateFontSize = Math.max(Math.round(infoHeight * 0.35), 16);
          context.fillStyle = "#1f2937";
          context.textAlign = "right";
          context.textBaseline = "top";
          context.font = `600 ${dateFontSize}px sans-serif`;
          const dateX = contentX + contentWidth;
          const dateY = infoTop;
          context.fillText(todayLabel, dateX, dateY);

          const createrLogo =
            createrLogoReadyRef.current && createrLogoImageRef.current
              ? createrLogoImageRef.current
              : null;
          if (createrLogo) {
            const spacing = Math.round(infoHeight * 0.12);
            const availableHeight = Math.max(
              infoBottom - (dateY + dateFontSize + spacing),
              1
            );
            const maxLogoWidth = contentWidth * 0.25;
            const scale = Math.min(
              maxLogoWidth / createrLogo.naturalWidth,
              availableHeight / createrLogo.naturalHeight,
              1
            );
            const drawWidth = createrLogo.naturalWidth * scale;
            const drawHeight = createrLogo.naturalHeight * scale;
            const logoX = contentX + contentWidth - drawWidth;
            const logoY = infoBottom - drawHeight;
            context.drawImage(createrLogo, logoX, logoY, drawWidth, drawHeight);
          }
        }

        context.restore();
      });

      const processFrame = async () => {
        if (
          !active ||
          !hands ||
          !selfieSegmentation ||
          !videoRef.current ||
          videoRef.current.videoWidth === 0 ||
          videoRef.current.videoHeight === 0
        ) {
          animationFrame = requestAnimationFrame(processFrame);
          return;
        }

        try {
          await hands.send({ image: videoRef.current });
          await selfieSegmentation.send({ image: videoRef.current });
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
      latestHandLandmarksRef.current = [];
      if (animationFrame) cancelAnimationFrame(animationFrame);
      if (hands) {
        hands
          .close()
          .catch((err) =>
            console.error("Failed to close MediaPipe Hands", err)
          );
      }
      if (selfieSegmentation) {
        selfieSegmentation
          .close()
          .catch((err) =>
            console.error(
              "Failed to close MediaPipe Selfie Segmentation",
              err
            )
          );
      }
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, [todayLabel]);

  return (
    <main className="py-16 min-h-screen bg-gradient-to-b from-[#110a2a] to-[#33446a] flex flex-col items-center justify-center">
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
            width: "min(90vw, 800px)",
            aspectRatio,
            backgroundColor: "#000",
            overflow: "hidden",
          }}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            style={{ display: "none" }}
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
        {(cameraError || overlayError || backgroundError || decorationError) && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
              marginTop: "0.75rem",
              color: "#f87171",
              textAlign: "center",
              fontSize: "0.875rem",
            }}
          >
            {cameraError && <p>{cameraError}</p>}
            {overlayError && <p>{overlayError}</p>}
            {backgroundError && <p>{backgroundError}</p>}
            {decorationError && <p>{decorationError}</p>}
          </div>
        )}
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

              const displayCanvas = canvasRef.current;

              if (!displayCanvas) {
                setCaptureMessage("カメラがまだ準備できていません。");
                return;
              }

              const { width, height } = displayCanvas;
              if (!width || !height) {
                setCaptureMessage("カメラ映像が利用できません。");
                return;
              }

              const snapshotCanvas = document.createElement("canvas");
              snapshotCanvas.width = width;
              snapshotCanvas.height = height;
              const context = snapshotCanvas.getContext("2d");

              if (!context) {
                setCaptureMessage("画像の生成に失敗しました。");
                return;
              }

              context.drawImage(displayCanvas, 0, 0, width, height);

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
              !!backgroundError ||
              !!decorationError ||
              !isReady ||
              !backgroundReady ||
              !serviceLogoReady ||
              !createrLogoReady
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
