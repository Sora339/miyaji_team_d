import { notFound } from "next/navigation"
import QRCode from "qrcode"

import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Props = { params: { photoId: string } }

export default async function DownloadPage({ params }: Props) {
  const { photoId } = await Promise.resolve(params)
  const resultId = Number(photoId)

  if (!Number.isFinite(resultId)) {
    notFound()
  }

  const result = await prisma.results.findUnique({
    where: { id: resultId },
    select: {
      photoUrl: true,
      appleCandyUrl: true,
    },
  })

  if (!result || !result.photoUrl) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-4 py-12 text-white">
        <h1 className="text-3xl font-bold">写真が見つかりませんでした</h1>
        <p className="text-center text-slate-300">
          撮影した写真がまだ保存されていないようです。カメラ画面で撮影し直してください。
        </p>
      </main>
    )
  }

  const qrDataUrl = await QRCode.toDataURL(result.photoUrl, {
    margin: 1,
    width: 512,
  })

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-8">
        <header className="text-center space-y-3">
          <h1 className="text-3xl font-bold">りんご飴フォト ダウンロード</h1>
          <p className="text-sm text-slate-300">
            下のQRコードをスマートフォンで読み取って、撮影した写真をダウンロードしてください。
          </p>
        </header>

        <section className="flex flex-col items-center gap-5">
          <div className="rounded-3xl bg-white p-4 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="撮影した写真をダウンロードするためのQRコード"
              className="h-64 w-64 object-contain"
            />
          </div>
          <a
            href={result.photoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-firework-gold px-6 py-3 text-lg font-semibold text-slate-900 shadow-lg transition hover:bg-yellow-300"
          >
            直接ダウンロードページを開く
          </a>
        </section>

        <section className="w-full rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold mb-3">撮影した写真</h2>
          <div className="relative w-full overflow-hidden rounded-2xl bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.photoUrl}
              alt="撮影した写真"
              className="h-full w-full object-contain"
            />
          </div>
        </section>

        {result.appleCandyUrl && (
          <section className="w-full rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold mb-3">あなたのりんご飴</h2>
            <div className="relative w-full overflow-hidden rounded-2xl bg-slate-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.appleCandyUrl}
                alt="生成されたりんご飴"
                className="h-full w-full object-contain"
              />
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
