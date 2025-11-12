import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Force TypeScript to reload types

// Lazy load Resend to avoid import issues
async function sendEmail(to: string, subject: string, text: string) {
  // Check if Resend is properly configured
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your-resend-api-key-here') {
    throw new Error('Resend API key is not configured. Please add your API key to the .env file.');
  }

  if (!process.env.FROM_EMAIL || process.env.FROM_EMAIL === 'noreply@yourdomain.com') {
    throw new Error('FROM_EMAIL is not configured. Please set a verified email address in the .env file.');
  }

  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  // Always try to send to the actual recipient
  // If using default domain without verification, Resend will return an error
  // which our error handling will catch and provide instructions
  
  return await resend.emails.send({
    from: process.env.FROM_EMAIL,
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
        paymentStatus: 'quote-sent',
        // Store structured quote data
        quoteDescription: description,
        quoteDuration: duration,
        quoteNotes: notes,
        quoteSentAt: new Date()
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

To confirm or reject this quote, simply reply to this email to discuss next steps.

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

    } catch (emailError: unknown) {
      console.error('Error sending email:', emailError);
      
      // Provide specific error messages for common issues
      let errorMessage = 'Failed to send email';
      let setupRequired = false;
      
      const errorMsg = emailError instanceof Error ? emailError.message : String(emailError);
      const errorObj = typeof emailError === 'object' && emailError !== null 
        ? emailError as { name?: string; message?: string } 
        : {};
      
      if (errorMsg.includes('API key')) {
        errorMessage = 'Email service not configured - missing API key';
        setupRequired = true;
      } else if (errorMsg.includes('FROM_EMAIL')) {
        errorMessage = 'Email service not configured - missing sender email';
        setupRequired = true;
      } else if (errorObj.name === 'validation_error' && errorMsg.includes('testing emails')) {
        errorMessage = 'Domain verification required. Using default domain, emails redirected to test address';
        setupRequired = true;
      } else if (errorMsg.includes('domain')) {
        errorMessage = 'Custom domain required for external emails. Verify domain at resend.com/domains';
        setupRequired = true;
      }
      
      return NextResponse.json({ 
        success: true,
        message: `Quote created successfully, but email could not be sent: ${errorMessage}`,
        emailError: errorMessage,
        setupRequired: setupRequired,
        domainSetupNeeded: errorObj.name === 'validation_error'
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
