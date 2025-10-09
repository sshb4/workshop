// app/api/availability/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Type interfaces for availability slot handling

// GET - Fetch teacher's availability slots
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')

    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID is required' }, { status: 400 })
    }

    const availabilitySlots = await prisma.availabilitySlot.findMany({
      where: {
        teacherId
      },
      orderBy: [
        { createdAt: 'asc' }
      ]
    })

    // Return all slots for now (filtering can be done on the client side)
    const activeSlots = availabilitySlots

    return NextResponse.json({ availabilitySlots: activeSlots })
  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 })
  }
}

// POST - Create new availability period
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      startDate,
      endDate,
      dayOfWeek,
      startTime,
      endTime,
    } = body

    // Validate required fields
    if (!startDate || dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Start date, day of week, start time, and end time are required' },
        { status: 400 }
      )
    }

    // Validate day of week (0-6)
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json({ error: 'Invalid day of week' }, { status: 400 })
    }

    // Validate time format and logic
    if (startTime >= endTime) {
      return NextResponse.json(
        { error: 'Start time must be before end time' },
        { status: 400 }
      )
    }

    // Validate date logic if end date is provided
    if (endDate && new Date(startDate) >= new Date(endDate)) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      )
    }

    // Create the availability slot
    const newSlot = await prisma.availabilitySlot.create({
      data: {
        teacherId: session.user.id,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        dayOfWeek,
        startTime,
        endTime,
        // Add the new fields that might not be in the old type definition
        ...(title && { title }),
        ...(true && { isActive: true })
      },
    })

    return NextResponse.json({ 
      success: true, 
      slot: newSlot,
      message: 'Availability period created successfully'
    })

  } catch (error) {
    console.error('Error creating availability slot:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

// DELETE - Remove availability slot
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const slotId = searchParams.get('id')

    if (!slotId) {
      return NextResponse.json({ error: 'Slot ID is required' }, { status: 400 })
    }

    // Verify the slot belongs to the current teacher
    const slot = await prisma.availabilitySlot.findUnique({
      where: { id: slotId }
    })

    if (!slot || slot.teacherId !== session.user.id) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 })
    }

    await prisma.availabilitySlot.delete({
      where: { id: slotId }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Availability slot deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting availability slot:', error)
    return NextResponse.json(
      { error: 'Failed to delete availability slot' },
      { status: 500 }
    )
  }
}
