// lib/email.ts
let resend: any = null;

// Try to initialize Resend, handle gracefully if not available
try {
  const { Resend } = require('resend');
  resend = new Resend(process.env.RESEND_API_KEY);
} catch (error) {
  console.warn('Resend package not installed. Email functionality will be simulated.');
}

interface BookingConfirmationEmail {
  to: string
  studentName: string
  teacherName: string
  bookingDate: string
  startTime: string
  endTime: string
  teacherEmail?: string
  notes?: string
  amountPaid?: number
}

interface BookingReminderEmail {
  to: string
  studentName: string
  teacherName: string
  bookingDate: string
  startTime: string
  endTime: string
  teacherEmail?: string
}

interface BookingCancellationEmail {
  to: string
  studentName: string
  teacherName: string
  bookingDate: string
  startTime: string
  endTime: string
  reason?: string
}

export async function sendBookingConfirmationEmail({
  to,
  studentName,
  teacherName,
  bookingDate,
  startTime,
  endTime,
  teacherEmail,
  notes,
  amountPaid
}: BookingConfirmationEmail) {
  // If Resend is not available, simulate email sending
  if (!resend) {
    console.log('📧 [SIMULATED] Booking confirmation email would be sent to:', {
      to,
      subject: 'Booking Confirmation',
      studentName,
      teacherName,
      bookingDate,
      startTime,
      endTime,
      amountPaid
    });
    return { success: true, message: 'Email simulated (Resend not installed)' };
  }

  try {
    const formattedDate = new Date(bookingDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    })

    const formattedStartTime = new Date(`2000-01-01T${startTime}:00`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })

    const formattedEndTime = new Date(`2000-01-01T${endTime}:00`).toLocaleTimeString('en-US', {
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    })

    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'bookings@yourdomain.com',
      to: [to],
      subject: `Booking Confirmation - Session with ${teacherName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Booking Confirmed! 🎉</h1>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1a202c; margin-top: 0;">Hi ${studentName},</h2>
            <p style="color: #4a5568; line-height: 1.6;">
              Your booking has been confirmed! Here are the details of your upcoming session:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #1a202c; margin-top: 0;">Session Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #4a5568; font-weight: bold;">Teacher:</td>
                  <td style="padding: 8px 0; color: #1a202c;">${teacherName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #4a5568; font-weight: bold;">Date:</td>
                  <td style="padding: 8px 0; color: #1a202c;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #4a5568; font-weight: bold;">Time:</td>
                  <td style="padding: 8px 0; color: #1a202c;">${formattedStartTime} - ${formattedEndTime}</td>
                </tr>
                ${teacherEmail ? `
                <tr>
                  <td style="padding: 8px 0; color: #4a5568; font-weight: bold;">Contact:</td>
                  <td style="padding: 8px 0; color: #1a202c;">${teacherEmail}</td>
                </tr>
                ` : ''}
                ${amountPaid ? `
                <tr>
                  <td style="padding: 8px 0; color: #4a5568; font-weight: bold;">Amount Paid:</td>
                  <td style="padding: 8px 0; color: #1a202c;">$${amountPaid.toFixed(2)}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            ${notes ? `
            <div style="background: #fef5e7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f6ad55;">
              <h4 style="color: #1a202c; margin-top: 0;">Additional Notes:</h4>
              <p style="color: #4a5568; margin-bottom: 0;">${notes}</p>
            </div>
            ` : ''}

            <div style="background: #e6fffa; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #38b2ac;">
              <h4 style="color: #1a202c; margin-top: 0;">📅 Add to Calendar</h4>
              <p style="color: #4a5568; margin-bottom: 0;">
                Don't forget to add this session to your calendar so you don't miss it!
              </p>
            </div>

            <p style="color: #4a5568; line-height: 1.6;">
              If you need to make any changes to your booking, please contact ${teacherName} directly${teacherEmail ? ` at ${teacherEmail}` : ''}.
            </p>

            <p style="color: #4a5568; line-height: 1.6;">
              We look forward to your session!
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #a0aec0; font-size: 12px;">
            This is an automated confirmation email for your booking.
          </div>
        </div>
      `
    })

    if (error) {
      console.error('Error sending booking confirmation email:', error)
      return { success: false, error }
    }

    console.log('Booking confirmation email sent successfully:', data)
    return { success: true, data }

  } catch (error) {
    console.error('Error sending booking confirmation email:', error)
    return { success: false, error }
  }
}

export async function sendBookingReminderEmail({
  to,
  studentName,
  teacherName,
  bookingDate,
  startTime,
  endTime,
  teacherEmail
}: BookingReminderEmail) {
  try {
    const formattedDate = new Date(bookingDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    })

    const formattedStartTime = new Date(`2000-01-01T${startTime}:00`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })

    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'bookings@yourdomain.com',
      to: [to],
      subject: `Reminder: Your session with ${teacherName} is tomorrow`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Session Reminder 📚</h1>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1a202c; margin-top: 0;">Hi ${studentName},</h2>
            <p style="color: #4a5568; line-height: 1.6;">
              This is a friendly reminder that you have a session scheduled with ${teacherName}.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f093fb;">
              <h3 style="color: #1a202c; margin-top: 0;">Session Details</h3>
              <p style="color: #4a5568; margin: 8px 0;"><strong>Date:</strong> ${formattedDate}</p>
              <p style="color: #4a5568; margin: 8px 0;"><strong>Time:</strong> ${formattedStartTime}</p>
              ${teacherEmail ? `<p style="color: #4a5568; margin: 8px 0;"><strong>Contact:</strong> ${teacherEmail}</p>` : ''}
            </div>

            <p style="color: #4a5568; line-height: 1.6;">
              Please make sure you're prepared and ready for your session. If you need to make any changes, please contact ${teacherName} as soon as possible.
            </p>
          </div>
        </div>
      `
    })

    if (error) {
      console.error('Error sending reminder email:', error)
      return { success: false, error }
    }

    return { success: true, data }

  } catch (error) {
    console.error('Error sending reminder email:', error)
    return { success: false, error }
  }
}

export async function sendBookingCancellationEmail({
  to,
  studentName,
  teacherName,
  bookingDate,
  startTime,
  endTime,
  reason
}: BookingCancellationEmail) {
  try {
    const formattedDate = new Date(bookingDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const formattedStartTime = new Date(`2000-01-01T${startTime}:00`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit', 
      hour12: true
    })

    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'bookings@yourdomain.com',
      to: [to],
      subject: `Booking Cancelled - Session with ${teacherName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #fc8181 0%, #f56565 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Booking Cancelled</h1>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1a202c; margin-top: 0;">Hi ${studentName},</h2>
            <p style="color: #4a5568; line-height: 1.6;">
              We wanted to let you know that your booking with ${teacherName} has been cancelled.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #fc8181;">
              <h3 style="color: #1a202c; margin-top: 0;">Cancelled Session Details</h3>
              <p style="color: #4a5568; margin: 8px 0;"><strong>Date:</strong> ${formattedDate}</p>
              <p style="color: #4a5568; margin: 8px 0;"><strong>Time:</strong> ${formattedStartTime}</p>
            </div>

            ${reason ? `
            <div style="background: #fef5e7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f6ad55;">
              <h4 style="color: #1a202c; margin-top: 0;">Reason for Cancellation:</h4>
              <p style="color: #4a5568; margin-bottom: 0;">${reason}</p>
            </div>
            ` : ''}

            <p style="color: #4a5568; line-height: 1.6;">
              If you'd like to reschedule or have any questions, please feel free to book a new session or contact ${teacherName} directly.
            </p>
          </div>
        </div>
      `
    })

    if (error) {
      console.error('Error sending cancellation email:', error)
      return { success: false, error }
    }

    return { success: true, data }

  } catch (error) {
    console.error('Error sending cancellation email:', error)
    return { success: false, error }
  }
}

export async function sendTeacherNotificationEmail({
  to,
  teacherName,
  studentName,
  studentEmail,
  bookingDate,
  startTime,
  endTime,
  amountPaid,
  notes
}: {
  to: string
  teacherName: string
  studentName: string
  studentEmail: string
  bookingDate: string
  startTime: string
  endTime: string
  amountPaid?: number
  notes?: string
}) {
  // If Resend is not available, simulate email sending
  if (!resend) {
    console.log('📧 [SIMULATED] Teacher notification email would be sent to:', {
      to,
      subject: 'New Booking Received',
      studentName,
      studentEmail,
      bookingDate,
      startTime,
      endTime,
      amountPaid
    });
    return { success: true, message: 'Email simulated (Resend not installed)' };
  }

  try {
    const formattedDate = new Date(bookingDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const formattedStartTime = new Date(`2000-01-01T${startTime}:00`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })

    const formattedEndTime = new Date(`2000-01-01T${endTime}:00`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })

    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'bookings@yourdomain.com',
      to: [to],
      subject: `New Booking: ${studentName} - ${formattedDate}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">New Booking Received! 📅</h1>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1a202c; margin-top: 0;">Hi ${teacherName},</h2>
            <p style="color: #4a5568; line-height: 1.6;">
              You have a new booking! Here are the student details:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4facfe;">
              <h3 style="color: #1a202c; margin-top: 0;">Booking Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #4a5568; font-weight: bold;">Student:</td>
                  <td style="padding: 8px 0; color: #1a202c;">${studentName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #4a5568; font-weight: bold;">Email:</td>
                  <td style="padding: 8px 0; color: #1a202c;">${studentEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #4a5568; font-weight: bold;">Date:</td>
                  <td style="padding: 8px 0; color: #1a202c;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #4a5568; font-weight: bold;">Time:</td>
                  <td style="padding: 8px 0; color: #1a202c;">${formattedStartTime} - ${formattedEndTime}</td>
                </tr>
                ${amountPaid ? `
                <tr>
                  <td style="padding: 8px 0; color: #4a5568; font-weight: bold;">Amount Paid:</td>
                  <td style="padding: 8px 0; color: #1a202c;">$${amountPaid.toFixed(2)}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            ${notes ? `
            <div style="background: #fef5e7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f6ad55;">
              <h4 style="color: #1a202c; margin-top: 0;">Student Notes:</h4>
              <p style="color: #4a5568; margin-bottom: 0;">${notes}</p>
            </div>
            ` : ''}

            <p style="color: #4a5568; line-height: 1.6;">
              The student has been sent a confirmation email with your contact information. Make sure to prepare for the session and reach out if you need to make any changes.
            </p>
          </div>
        </div>
      `
    })

    if (error) {
      console.error('Error sending teacher notification email:', error)
      return { success: false, error }
    }

    return { success: true, data }

  } catch (error) {
    console.error('Error sending teacher notification email:', error)
    return { success: false, error }
  }
}
