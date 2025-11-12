import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Lazy load Resend to avoid import issues
async function sendEmail(to: string, subject: string, text: string) {
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  return await resend.emails.send({
    from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
    to: [to],
    subject: subject,
    text: text,
  });
}

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

    // Update the booking with quote information
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        notes: quoteInfo,
        amountPaid: parseFloat(amount),
        paymentStatus: 'quote-sent'  // Update status to quote-sent
      }
    })

    // Send the quote email using Resend  
    const emailText = `
Hi ${booking.studentName},

Thank you for your booking request! I've prepared a quote for you based on your needs.

QUOTE DETAILS:
==============
Service: ${description}
Amount: $${amount}
Duration: ${duration} hours
${notes ? `\nAdditional Notes: ${notes}` : ''}

Ready to proceed? Simply reply to this email to confirm your booking and discuss next steps.

Best regards,
${booking.teacher.name}

---
This quote is valid for 7 days. If you have any questions, please don't hesitate to reach out.
    `;

    try {
      const { data: emailData, error: emailError } = await sendEmail(
        booking.studentEmail,
        `Quote for Your Booking Request - ${booking.teacher.name}`,
        emailText
      );

      if (emailError) {
        console.error('Error sending email:', emailError);
        // Don't fail the entire request if email fails, just log it
        return NextResponse.json({ 
          success: true,
          message: 'Quote created successfully, but email could not be sent',
          emailError: emailError.message
        });
      }

      console.log('Quote email sent successfully:', emailData);

      return NextResponse.json({ 
        success: true,
        message: 'Quote created and email sent successfully',
        emailId: emailData?.id
      });

    } catch (emailError) {
      console.error('Error sending email:', emailError);
      
      return NextResponse.json({ 
        success: true,
        message: 'Quote created successfully, but email could not be sent',
        emailError: 'Failed to send email'
      });
    }

  } catch (error) {
    console.error('Error creating quote:', error)
    return NextResponse.json(
      { error: 'Failed to create quote' }, 
      { status: 500 }
    )
  }
}
