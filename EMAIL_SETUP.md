# Email Setup Instructions

## Quick Start Guide

### Step 1: Get Resend API Key
1. Go to https://resend.com and create an account
2. Navigate to API Keys in your dashboard
3. Click "Create API Key" 
4. Copy the key that starts with `re_`

### Step 2: Configure Environment
Update your `.env` file with your actual values:

```env
# Replace with your actual Resend API key
RESEND_API_KEY=re_your_actual_api_key_here

# For testing: Use onboarding@resend.dev
# For production: Use your verified domain
FROM_EMAIL=onboarding@resend.dev
```

### Step 3: Test Email Functionality
1. Create a booking request from your site
2. Go to Admin → Manage Bookings
3. Create a quote for the request
4. You should see "Quote created and email sent successfully"

## Domain Setup (Optional - For Production)
1. Add your domain in Resend dashboard
2. Verify ownership via DNS records
3. Update `FROM_EMAIL` to use your domain: `noreply@yourdomain.com`

## Troubleshooting

### "Email service not configured" Error
- ✅ Check your `RESEND_API_KEY` in `.env`
- ✅ Make sure you restarted your dev server after changing `.env`
- ✅ Verify the API key starts with `re_`

### "Failed to send email" Error  
- ✅ Check your FROM_EMAIL address is valid
- ✅ For production, ensure your domain is verified in Resend
- ✅ For testing, use `onboarding@resend.dev`

## Quote Email Feature
✅ **Professional email template** with service details
✅ **Automatic status updates** to 'quote-sent' 
✅ **Error handling** with helpful messages
✅ **Graceful fallback** - quote saves even if email fails

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
