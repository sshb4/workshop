import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      bookingId,
      description,
      amount,
      duration,
      notes
    } = body

    // Validate required fields
    if (!bookingId || !description || !amount || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      )
    }

    // Check if booking exists and belongs to this teacher
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        teacherId: session.user.id,
        paymentStatus: 'request'
      },
      include: {
        teacher: true
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking request not found' }, { status: 404 })
    }

    // For now, we'll just update the booking notes with the quote information
    // In a full implementation, you might want a separate quotes table
    const quoteInfo = `QUOTE CREATED:\n\nService: ${description}\nAmount: $${amount}\nDuration: ${duration} hours\n${notes ? `Notes: ${notes}\n` : ''}\n--- Original Request ---\n${booking.notes || ''}`

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        notes: quoteInfo,
        amountPaid: parseFloat(amount),
        paymentStatus: 'quote-sent'  // Update status to quote-sent
      }
    })

    // In a real implementation, you'd send an email to the customer here
    // For now, we'll just simulate it
    console.log(`[SIMULATED] Quote email would be sent to ${booking.studentEmail}:`)
    console.log(`Subject: Quote for your booking request`)
    console.log(`Amount: $${amount} for ${duration} hours`)
    console.log(`Description: ${description}`)

    return NextResponse.json({ 
      success: true,
      message: 'Quote created successfully'
    })

  } catch (error) {
    console.error('Error creating quote:', error)
    return NextResponse.json(
      { error: 'Failed to create quote' }, 
      { status: 500 }
    )
  }
}
