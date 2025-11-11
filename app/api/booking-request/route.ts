import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { sendBookingRequestEmail, sendTeacherNotificationEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      teacherId,
      formData
    } = body

    // Validate required fields
    if (!teacherId || !formData) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      )
    }

    // Check if teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Extract required fields from formData
    const studentName = formData.name || 'Anonymous'
    const studentEmail = formData.email || 'noemail@example.com'
    const studentPhone = formData.phone || ''
    const preferredDates = formData.dates || ''
    const notes = formData.description || ''
    const address = formData.address || ''

    // If no custom fields are configured, create a generic request
    if (Object.keys(formData).length === 0) {
      // Create a generic booking request when no fields are configured
      const booking = await prisma.booking.create({
        data: {
          teacherId: teacherId,
          studentName: 'New Booking Request',
          studentEmail: 'pending@example.com',
          studentPhone: '',
          bookingDate: new Date(),
          startTime: '00:00',
          endTime: '00:00',
          amountPaid: 0,
          paymentStatus: 'request',
          notes: 'Booking request submitted without custom fields configured.',
        }
      })

      return NextResponse.json({ 
        success: true,
        booking: {
          ...booking,
          type: 'request'
        }
      })
    }

    // Create a booking request with status "request"
    const booking = await prisma.booking.create({
      data: {
        teacherId: teacherId,
        studentName,
        studentEmail,
        studentPhone,
        bookingDate: new Date(), // Temporary date - will be updated when confirmed
        startTime: '00:00', // Temporary time - will be updated when confirmed
        endTime: '00:00', // Temporary time - will be updated when confirmed
        amountPaid: 0,
        paymentStatus: 'request', // Mark as request
        notes: `Preferred Dates: ${preferredDates}\nAddress: ${address}\nNotes: ${notes}`.trim(),
      }
    })

    // Send notification emails
    try {
      // Send confirmation email to student
      await sendBookingRequestEmail({
        to: studentEmail,
        studentName: studentName,
        teacherName: teacher.name || 'Teacher',
        teacherEmail: teacher.email,
        preferredDates: preferredDates,
        notes: notes
      })

      // Send notification email to teacher
      await sendTeacherNotificationEmail({
        to: teacher.email,
        teacherName: teacher.name || 'Teacher',
        studentName: studentName,
        studentEmail: studentEmail,
        bookingDate: 'To be confirmed',
        startTime: 'To be confirmed',
        endTime: 'To be confirmed',
        amountPaid: 0,
        notes: `NEW BOOKING REQUEST\n\nPreferred Dates: ${preferredDates}\nAddress: ${address}\nPhone: ${studentPhone}\nNotes: ${notes}`
      })

      console.log('Booking request emails sent successfully')
    } catch (emailError) {
      console.error('Failed to send booking request emails:', emailError)
      // Don't fail the booking if email fails - just log the error
    }

    return NextResponse.json({ 
      success: true,
      booking: {
        ...booking,
        type: 'request'
      }
    })

  } catch (error) {
    console.error('Error creating booking request:', error)
    return NextResponse.json(
      { error: 'Failed to create booking request' }, 
      { status: 500 }
    )
  }
}
