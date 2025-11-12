# Email Setup Instructions

## Prerequisites
1. Install the Resend package: `npm install resend` ✅ (Already installed)
2. Sign up for a Resend account at https://resend.com
3. Get your API key from the Resend dashboard

## Environment Configuration
Update your `.env` file with your Resend credentials:

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
```

## Domain Setup
1. Add and verify your domain in Resend dashboard
2. Update the `FROM_EMAIL` variable to use your verified domain
3. For development, you can use the default Resend test domain

## Quote Email Feature
The quote functionality now sends professional emails to customers when teachers create quotes:

- **Template**: Uses a custom React email template with branding
- **Content**: Includes service description, amount, duration, and notes  
- **Status**: Automatically updates booking status to 'quote-sent'
- **Feedback**: Shows success/error messages in the admin dashboard

## Email Features Implemented

### Student Booking Confirmation
- Sent automatically when a booking is created
- Includes booking details, teacher info, and cancellation instructions
- Professional HTML template with booking summary

### Teacher Notification
- Sent to teacher when new booking is received
- Contains student details and booking information
- Includes quick action buttons for managing the booking

### Reminder Emails (Available)
- Can be scheduled to remind students before their lessons
- Configurable timing (24 hours, 1 hour before, etc.)

### Cancellation Emails (Available)
- Sent when bookings are cancelled
- Includes reason and refund information if applicable

## Testing
1. Use Resend's test mode for development
2. Check email delivery in Resend dashboard
3. Monitor email logs for debugging

## Production Considerations
- Set up proper SPF, DKIM, and DMARC records
- Use a professional sending domain
- Monitor delivery rates and bounce handling
- Consider rate limiting for bulk operations

## Email Functions Available

- `sendBookingConfirmationEmail()` - Confirm new bookings
- `sendTeacherNotificationEmail()` - Notify teachers of new bookings  
- `sendBookingReminderEmail()` - Remind students of upcoming lessons
- `sendBookingCancellationEmail()` - Confirm cancellations

All functions are integrated into the booking APIs and will work once the Resend package is installed and configured.
