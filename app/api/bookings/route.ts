// app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendBookingConfirmationEmail, sendTeacherNotificationEmail } from '@/lib/email'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Fetch bookings for a teacher
export async function GET() {
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
      customerName,
      customerEmail,
      customerPhone,
      additionalNotes,
      selectedSlots
    } = body

    // Validate required fields
    if (!teacherId || !customerName || !customerEmail || !selectedSlots || selectedSlots.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(customerEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
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

    // Calculate total hours and cost
    let totalHours = 0
    for (const slot of selectedSlots) {
      const startTime = slot.customStartTime || slot.startTime
      const endTime = slot.customEndTime || slot.endTime
      const start = new Date(`2000-01-01T${startTime}:00`)
      const end = new Date(`2000-01-01T${endTime}:00`)
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      totalHours += hours
    }

    const totalAmount = teacher.hourlyRate ? totalHours * Number(teacher.hourlyRate) : 0

    // Create bookings for each selected slot
    const createdBookings = []
    
    for (const slot of selectedSlots) {
      const startTime = slot.customStartTime || slot.startTime
      const endTime = slot.customEndTime || slot.endTime
      
      // Calculate hours for this specific slot
      const start = new Date(`2000-01-01T${startTime}:00`)
      const end = new Date(`2000-01-01T${endTime}:00`)
      const slotHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      const slotAmount = teacher.hourlyRate ? slotHours * Number(teacher.hourlyRate) : 0

      const booking = await prisma.booking.create({
        data: {
          teacherId: teacherId,
          studentName: customerName,
          studentEmail: customerEmail,
          studentPhone: customerPhone || '',
          bookingDate: new Date(slot.date), // Use actual selected date
          startTime: startTime,
          endTime: endTime,
          amountPaid: slotAmount,
          paymentStatus: 'pending', // Since payment isn't integrated yet
          notes: additionalNotes || null,
        }
      })

      createdBookings.push(booking)
    }

    console.log(`Created ${createdBookings.length} bookings for teacher ${teacherId}`)

    // Send emails (student confirmation and teacher notification)
    try {
      // Send confirmation email to student for the first booking slot
      const firstSlot = selectedSlots[0]
      const startTime = firstSlot.customStartTime || firstSlot.startTime
      const endTime = firstSlot.customEndTime || firstSlot.endTime
      
      await sendBookingConfirmationEmail({
        to: customerEmail,
        studentName: customerName,
        teacherName: teacher.name || 'Teacher',
        bookingDate: new Date(firstSlot.date).toLocaleDateString(),
        startTime: startTime,
        endTime: endTime,
        teacherEmail: teacher.email,
        notes: additionalNotes,
        amountPaid: totalAmount
      })

      // Send notification email to teacher
      await sendTeacherNotificationEmail({
        to: teacher.email,
        teacherName: teacher.name || 'Teacher',
        studentName: customerName,
        studentEmail: customerEmail,
        bookingDate: new Date(firstSlot.date).toLocaleDateString(),
        startTime: startTime,
        endTime: endTime,
        amountPaid: totalAmount,
        notes: additionalNotes
      })

      console.log('Booking confirmation emails sent successfully')
    } catch (emailError) {
      console.error('Failed to send booking emails:', emailError)
      // Don't fail the booking if email fails - just log the error
    }

    return NextResponse.json({
      success: true,
      message: 'Booking created successfully',
      bookings: createdBookings,
      totalHours: totalHours,
      totalAmount: totalAmount
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
