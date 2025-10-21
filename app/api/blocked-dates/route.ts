// app/api/blocked-dates/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id as string

    // Get blocked dates from the BlockedDate model
    const blockedDates = await prisma.blockedDate.findMany({
      where: { teacherId: userId },
      orderBy: { startDate: 'asc' }
    })

    // Format the dates for the frontend
    const formattedBlockedDates = blockedDates.map(date => ({
      id: date.id,
      startDate: date.startDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
      endDate: date.endDate.toISOString().split('T')[0],
      reason: date.reason,
      isRecurring: date.isRecurring,
      recurringType: date.recurringType
    }))

    return NextResponse.json({ blockedDates: formattedBlockedDates })
  } catch (error) {
    console.error('Error fetching blocked dates:', error)
    return NextResponse.json({ error: 'Failed to fetch blocked dates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id as string
    const body = await request.json()

    const { startDate, endDate, reason, isRecurring, recurringType } = body

    if (!startDate) {
      return NextResponse.json({ error: 'Start date is required' }, { status: 400 })
    }

    // Create new blocked date
    const newBlockedDate = await prisma.blockedDate.create({
      data: {
        teacherId: userId,
        startDate: new Date(startDate),
        endDate: new Date(endDate || startDate),
        reason: reason || 'Unavailable',
        isRecurring: isRecurring || false,
        recurringType: isRecurring ? recurringType : null
      }
    })

    // Format the response
    const formattedBlockedDate = {
      id: newBlockedDate.id,
      startDate: newBlockedDate.startDate.toISOString().split('T')[0],
      endDate: newBlockedDate.endDate.toISOString().split('T')[0],
      reason: newBlockedDate.reason,
      isRecurring: newBlockedDate.isRecurring,
      recurringType: newBlockedDate.recurringType
    }

    return NextResponse.json({ 
      message: 'Blocked date added successfully', 
      blockedDate: formattedBlockedDate 
    })
  } catch (error) {
    console.error('Error adding blocked date:', error)
    return NextResponse.json({ error: 'Failed to add blocked date' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id as string
    const { searchParams } = new URL(request.url)
    const blockedDateId = searchParams.get('id')

    if (!blockedDateId) {
      return NextResponse.json({ error: 'Blocked date ID is required' }, { status: 400 })
    }

    // Verify the blocked date belongs to the current user
    const blockedDate = await prisma.blockedDate.findFirst({
      where: { 
        id: blockedDateId,
        teacherId: userId
      }
    })

    if (!blockedDate) {
      return NextResponse.json({ error: 'Blocked date not found' }, { status: 404 })
    }

    // Delete the blocked date
    await prisma.blockedDate.delete({
      where: { id: blockedDateId }
    })

    return NextResponse.json({ message: 'Blocked date removed successfully' })
  } catch (error) {
    console.error('Error removing blocked date:', error)
    return NextResponse.json({ error: 'Failed to remove blocked date' }, { status: 500 })
  }
}
