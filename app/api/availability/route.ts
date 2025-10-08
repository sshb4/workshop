// app/api/availability/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Get form data
    const formData = await request.formData()
    const dayOfWeek = parseInt(formData.get('dayOfWeek') as string)
    const startTime = formData.get('startTime') as string
    const endTime = formData.get('endTime') as string
    const durationMinutes = parseInt(formData.get('durationMinutes') as string)

    // Validate required fields
    if (isNaN(dayOfWeek) || !startTime || !endTime || isNaN(durationMinutes)) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate day of week (0-6)
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json(
        { error: 'Invalid day of week' },
        { status: 400 }
      )
    }

    // Validate time format and logic
    if (startTime >= endTime) {
      return NextResponse.json(
        { error: 'Start time must be before end time' },
        { status: 400 }
      )
    }

    // Check for overlapping slots
    const existingSlots = await prisma.availabilitySlot.findMany({
      where: {
        teacherId: session.user.id,
        dayOfWeek: dayOfWeek,
      },
    })

    const hasOverlap = existingSlots.some(slot => {
      return (
        (startTime >= slot.startTime && startTime < slot.endTime) ||
        (endTime > slot.startTime && endTime <= slot.endTime) ||
        (startTime <= slot.startTime && endTime >= slot.endTime)
      )
    })

    if (hasOverlap) {
      return NextResponse.json(
        { error: 'This time slot overlaps with an existing availability slot' },
        { status: 400 }
      )
    }

    // Create the availability slot
    const availabilitySlot = await prisma.availabilitySlot.create({
      data: {
        teacherId: session.user.id,
        dayOfWeek,
        startTime,
        endTime,
        durationMinutes,
      },
    })

    // Redirect back to availability page
    return NextResponse.redirect(new URL('/admin/availability', request.url))

  } catch (error) {
    console.error('Error creating availability slot:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
