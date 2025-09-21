import { NextResponse } from 'next/server'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'

import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const APPLE_CANDY_BUCKET = 'apple-candy-images'
const TEST_IMAGE_PATH = join(process.cwd(), 'public', 'image', 'base', '1.png')

export async function POST() {
  try {
    const fileBuffer = await fs.readFile(TEST_IMAGE_PATH)

    const objectPath = `tests/${Date.now()}-red-origin.png`
    const { error: uploadError } = await supabaseAdmin.storage
      .from(APPLE_CANDY_BUCKET)
      .upload(objectPath, fileBuffer, {
        contentType: 'image/png',
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`)
    }

    const { data: publicData } = supabaseAdmin.storage
      .from(APPLE_CANDY_BUCKET)
      .getPublicUrl(objectPath)

    if (!publicData?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded image.')
    }

    const result = await prisma.results.create({
      data: {
        answers: [],
        appleCandyUrl: publicData.publicUrl,
        photoUrl: null,
      },
    })

    return NextResponse.json({
      success: true,
      resultId: result.id,
      appleCandyUrl: result.appleCandyUrl,
    })
  } catch (error) {
    console.error('Test upload failed', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
