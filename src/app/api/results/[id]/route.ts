import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(_: Request, context: RouteContext) {
  const { id: idParam } = await context.params
  const id = Number(idParam)
  if (!Number.isFinite(id)) {
    return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 })
  }

  try {
    const result = await prisma.results.findUnique({ where: { id } })

    if (!result) {
      return NextResponse.json({ success: false, error: 'Result not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      result: {
        id: result.id,
        answers: result.answers,
        appleCandyUrl: result.appleCandyUrl,
        photoUrl: result.photoUrl,
      },
    })
  } catch (error) {
    console.error('Failed to fetch result', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
