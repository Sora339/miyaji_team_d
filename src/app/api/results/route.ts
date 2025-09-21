import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const result = await prisma.results.create({
      data: {},
      select: {
        id: true,
      },
    })

    return NextResponse.json({
      success: true,
      resultId: result.id,
    })
  } catch (error) {
    console.error('Failed to create result record:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create result record',
      },
      { status: 500 },
    )
  }
}
