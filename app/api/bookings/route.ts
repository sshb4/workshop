// app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// GET - Fetch bookings for a teacher
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bookings = await prisma.booking.findMany({
      where: { teacherId: session.user.id },
      orderBy: { bookingDate: 'asc' },
    })

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      teacherId,
      studentName,
      studentEmail,
      studentPhone,
      bookingDate,
      startTime,
      endTime,
      amountPaid,
      notes,
      externalBookingId, // From your external booking API
    } = body

    // Validate required fields
    if (!teacherId || !studentName || !studentEmail || !bookingDate || !startTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        teacherId,
        studentName,
        studentEmail,
        studentPhone,
        bookingDate: new Date(bookingDate),
        startTime,
        endTime,
        amountPaid: parseFloat(amountPaid) || 0,
        paymentStatus: 'pending',
        notes,
        // externalBookingId, // Add if you extend schema
      },
    })

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
