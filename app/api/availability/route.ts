// app/api/availability/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    // Validate required fields
    if (!dayOfWeek && dayOfWeek !== 0 || !startTime || !endTime) {
      const url = new URL('/admin/availability', request.url)
      url.searchParams.set('error', 'Day of week, start time, and end time are required')
      return NextResponse.redirect(url)
    }

    // Validate day of week (0-6)
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      const url = new URL('/admin/availability', request.url)
      url.searchParams.set('error', 'Invalid day of week')
      return NextResponse.redirect(url)
    }

    // Validate time format and logic
    if (startTime >= endTime) {
      const url = new URL('/admin/availability', request.url)
      url.searchParams.set('error', 'Start time must be before end time')
      return NextResponse.redirect(url)
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
      const url = new URL('/admin/availability', request.url)
      url.searchParams.set('error', 'This time window overlaps with an existing availability window')
      return NextResponse.redirect(url)
    }

    // Create the availability slot
    await prisma.availabilitySlot.create({
      data: {
        teacherId: session.user.id,
        dayOfWeek,
        startTime,
        endTime,
      },
    })

    // Redirect back to availability page with success message
    const url = new URL('/admin/availability', request.url)
    url.searchParams.set('success', 'Availability window added successfully')
    return NextResponse.redirect(url)

  } catch (error) {
    console.error('Error creating availability slot:', error)
    const url = new URL('/admin/availability', request.url)
    url.searchParams.set('error', 'Something went wrong. Please try again.')
    return NextResponse.redirect(url)
  }
}
