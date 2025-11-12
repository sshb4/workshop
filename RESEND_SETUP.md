# Resend Email Setup Quick Guide

## 🚀 Quick Setup Instructions

### 1. Get Your Resend API Key
1. Go to [resend.com](https://resend.com) and sign up/login
2. Navigate to API Keys in your dashboard
3. Click "Create API Key"
4. Copy the key (starts with `re_`)

### 2. Update Your Environment Variables
Replace the placeholder in your `.env` file:

```bash
# Replace this line:
RESEND_API_KEY=your-resend-api-key-here

# With your actual key:
RESEND_API_KEY=re_abcd1234...
```

### 3. Set Your From Email (Optional)
```bash
# For production, use your verified domain:
FROM_EMAIL=quotes@yourdomain.com

# For testing, you can use:
FROM_EMAIL=onboarding@resend.dev
```

### 4. Test the Quote Functionality
1. Create a booking request as a customer
2. Go to Admin → Manage Bookings
3. Click "Quote" on a request
4. Fill out the quote details and submit
5. Check that the email was sent successfully

## 🎯 Current Features
- ✅ Date range selection for booking requests
- ✅ Plain text quote emails (compatible with all email clients)
- ✅ Error handling for failed email sends
- ✅ Graceful degradation (quote saves even if email fails)

## 🔧 Troubleshooting
- **"API key is invalid"**: Replace the placeholder API key with your real key
- **Email not sending**: Check your FROM_EMAIL domain is verified in Resend
- **Rate limits**: Free Resend accounts have sending limits

---
*Last updated: November 2025*
