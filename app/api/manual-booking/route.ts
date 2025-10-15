import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { sendBookingConfirmationEmail, sendTeacherNotificationEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      studentName,
      studentEmail,
      studentPhone,
      bookingDate,
      startTime,
      endTime,
      amountPaid,
      paymentStatus,
      notes
    } = body

    // Validate required fields
    if (!studentName || !studentEmail || !bookingDate || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      )
    }

    // Check if teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: session.user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Parse the booking date and create datetime objects
    const bookingDateTime = new Date(bookingDate)
    
    // Check if there's already a booking at this time
    const existingBooking = await prisma.booking.findFirst({
      where: {
        teacherId: session.user.id,
        bookingDate: bookingDateTime,
        startTime: startTime
      }
    })

    if (existingBooking) {
      return NextResponse.json(
        { error: 'A booking already exists at this time' }, 
        { status: 400 }
      )
    }

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        teacherId: session.user.id,
        studentName,
        studentEmail,
        studentPhone: studentPhone || '',
        bookingDate: bookingDateTime,
        startTime,
        endTime,
        amountPaid: amountPaid || 0,
        paymentStatus: paymentStatus || 'paid', // Default to paid for manual bookings
        notes: notes || '',
      }
    })

    // Send emails (student confirmation and teacher notification)
    try {
      // Send confirmation email to student
      await sendBookingConfirmationEmail({
        to: studentEmail,
        studentName: studentName,
        teacherName: teacher.name || 'Teacher',
        bookingDate: bookingDateTime.toLocaleDateString(),
        startTime: startTime,
        endTime: endTime,
        teacherEmail: teacher.email,
        notes: notes,
        amountPaid: amountPaid || 0
      })

      // Send notification email to teacher
      await sendTeacherNotificationEmail({
        to: teacher.email,
        teacherName: teacher.name || 'Teacher',
        studentName: studentName,
        studentEmail: studentEmail,
        bookingDate: bookingDateTime.toLocaleDateString(),
        startTime: startTime,
        endTime: endTime,
        amountPaid: amountPaid || 0,
        notes: notes
      })

      console.log('Manual booking confirmation emails sent successfully')
    } catch (emailError) {
      console.error('Failed to send manual booking emails:', emailError)
      // Don't fail the booking if email fails - just log the error
    }

    return NextResponse.json({ 
      success: true,
      booking 
    })

  } catch (error) {
    console.error('Error creating manual booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' }, 
      { status: 500 }
    )
  }
}
