import QRCode from "qrcode"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Props = { params: { photoId: string } }

export default async function DownloadPage({ params }: Props) {
  const photoId = params.photoId

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"
  const payload = `${base}/download/${encodeURIComponent(photoId)}`

  // SVG生成
  const svg = await QRCode.toString(payload, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    width: 256,
  })
  const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`

  // PNG生成
  const pngBuffer = await QRCode.toBuffer(payload, {
    type: "png",
    margin: 1,
    width: 256,
  })
  const pngBase64 = pngBuffer.toString("base64")
  const pngDataUrl = `data:image/png;base64,${pngBase64}`

  return (
    <main style={{ padding: 24 }}>
      <h1>QR for: {photoId}</h1>

      <h2>SVG</h2>
      {/* SVGは直接埋め込み */}
      <div dangerouslySetInnerHTML={{ __html: svg }} />
      <p>
        <a href={svgDataUrl} download={`qr-${photoId}.svg`}>
          SVGをダウンロード
        </a>
      </p>

      <h2>PNG</h2>
      <img src={pngDataUrl} alt="QR PNG" width={256} height={256} />
      <p>
        <a href={pngDataUrl} download={`qr-${photoId}.png`}>
          PNGをダウンロード
        </a>
      </p>
    </main>
  )
}
