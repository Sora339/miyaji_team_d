import { NextResponse } from 'next/server'
import { Buffer } from 'node:buffer'

import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const PURIKURA_BUCKET = 'purikura-photos'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: Request, context: RouteContext) {
  const { id: idParam } = await context.params
  const id = Number(idParam)
  if (!Number.isFinite(id)) {
    return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: '写真データが見つかりません。' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)
    const filePath = `results/${id}/photo-${Date.now()}.png`

    const { error: uploadError } = await supabaseAdmin.storage
      .from(PURIKURA_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType: file.type || 'image/png',
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Failed to upload photo: ${uploadError.message}`)
    }

    const { data: publicData } = supabaseAdmin.storage
      .from(PURIKURA_BUCKET)
      .getPublicUrl(filePath)

    if (!publicData?.publicUrl) {
      throw new Error('Failed to get public URL for photo.')
    }

    const updated = await prisma.results.update({
      where: { id },
      data: {
        photoUrl: publicData.publicUrl,
      },
    })

    return NextResponse.json({
      success: true,
      photoUrl: updated.photoUrl,
    })
  } catch (error) {
    console.error('Failed to save photo', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
