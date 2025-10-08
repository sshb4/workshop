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

    // Find teacher by business/admin ID
    const teacher = await prisma.teacher.findFirst({
      where: {
        OR: [
          { externalBusinessId: business_id },
          { externalAdminId: admin_id },
        ],
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

async function handleBookingCreated(teacherId: string, bookingData: any) {
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
      externalBookingId: bookingData.external_id,
      syncedAt: new Date(),
    },
  })
  
  console.log('Created booking from webhook:', booking.id)
  return booking
}

async function handleBookingUpdated(teacherId: string, bookingData: any) {
  // Find existing booking by external ID
  const booking = await prisma.booking.findFirst({
    where: {
      teacherId,
      externalBookingId: bookingData.external_id,
    },
  })

  if (booking) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: bookingData.payment_status,
        notes: bookingData.notes,
        syncedAt: new Date(),
      },
    })
  }
}

async function handleBookingCancelled(teacherId: string, bookingData: any) {
  // Delete or mark as cancelled
  const booking = await prisma.booking.findFirst({
    where: {
      teacherId,
      externalBookingId: bookingData.external_id,
    },
  })

  if (booking) {
    await prisma.booking.delete({
      where: { id: booking.id },
    })
  }
}
