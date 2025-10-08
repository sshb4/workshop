// app/api/webhooks/booking/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate webhook signature/token if needed
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      event_type,
      business_id,
      admin_id,
      booking_data,
    } = body

    // Find teacher by ID (you can add this logic back later)
    const teacher = await prisma.teacher.findFirst({
      where: {
        id: business_id, // For now, just use business_id as teacher ID
      },
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    switch (event_type) {
      case 'booking.created':
        await handleBookingCreated(teacher.id, booking_data)
        break
      case 'booking.updated':
        await handleBookingUpdated(teacher.id, booking_data)
        break
      case 'booking.cancelled':
        await handleBookingCancelled(teacher.id, booking_data)
        break
      default:
        console.log(`Unhandled event type: ${event_type}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

interface BookingData {
  student_name: string
  student_email: string
  student_phone?: string
  date: string
  start_time: string
  end_time: string
  booking_date: string
  amount_paid: string
  payment_status?: string
  notes?: string
}

async function handleBookingCreated(teacherId: string, bookingData: BookingData) {
  const booking = await prisma.booking.create({
    data: {
      teacherId,
      studentName: bookingData.student_name,
      studentEmail: bookingData.student_email,
      studentPhone: bookingData.student_phone || '',
      bookingDate: new Date(bookingData.booking_date),
      startTime: bookingData.start_time,
      endTime: bookingData.end_time,
      amountPaid: parseFloat(bookingData.amount_paid) || 0,
      paymentStatus: bookingData.payment_status || 'pending',
      notes: bookingData.notes || '',
    },
  })
  
  console.log('Created booking from webhook:', booking.id)
  return booking
}

async function handleBookingUpdated(teacherId: string, bookingData: BookingData) {
  // Find existing booking by some identifier (you can modify this logic later)
  const booking = await prisma.booking.findFirst({
    where: {
      teacherId,
      studentEmail: bookingData.student_email, // Use email as identifier for now
    },
  })

  if (booking) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: bookingData.payment_status,
        notes: bookingData.notes,
      },
    })
  }
}

async function handleBookingCancelled(teacherId: string, bookingData: BookingData) {
  // Delete or mark as cancelled
  const booking = await prisma.booking.findFirst({
    where: {
      teacherId,
      studentEmail: bookingData.student_email, // Use email as identifier for now
    },
  })

  if (booking) {
    await prisma.booking.delete({
      where: { id: booking.id },
    })
  }
}
