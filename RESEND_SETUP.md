# Resend Email Setup Quick Guide

## ⚡ Important: One API Key for Your Entire App

**YOU (the app owner) need ONE Resend account and ONE API key.**

- ✅ All users share YOUR single API key
- ✅ Users never see or touch Resend
- ✅ Your backend handles all emails automatically
- ❌ Users do NOT need their own API keys
- ❌ Users do NOT sign up for Resend

This is how production apps work: Slack, Notion, GitHub, etc. all use ONE email service for millions of users.

## 🚀 Quick Setup Instructions

### 1. Get YOUR Resend API Key (One Time Setup)
1. **YOU** go to [resend.com](https://resend.com) and sign up/login
2. Navigate to API Keys in your dashboard
3. Click "Create API Key"
4. Copy the key (starts with `re_`)

### 2. Update Your Environment Variables
Add YOUR API key to your `.env` file (never commit this to git):

```bash
# Your single API key for the entire app
RESEND_API_KEY=re_abcd1234...
```

### 3. Set Your From Email
```bash
# For production, use YOUR verified domain:
FROM_EMAIL=noreply@yourdomain.com

# For testing, you can use Resend's test domain:
FROM_EMAIL=onboarding@resend.dev
```

**Note:** All emails will be sent FROM your domain, TO your users' email addresses.

### 4. Test Email Functionality
1. Start your app
2. Have any user trigger an email (signup, booking request, etc.)
3. YOUR Resend account sends the email automatically
4. The user receives the email - they never know Resend exists!

## 🎯 How It Works

```
User Action → Your Backend → YOUR Resend API Key → Email Sent
```

**All users get email functionality through YOUR single Resend account:**
- User 1 signs up → YOUR backend → YOUR Resend key → Verification email sent
- User 2 books lesson → YOUR backend → YOUR Resend key → Confirmation email sent
- User 3 gets quote → YOUR backend → YOUR Resend key → Quote email sent

## 📊 Resend Free Tier

Your ONE Resend account includes:
- **100 emails/day** free (across ALL users)
- **3,000 emails/month** free
- If you need more, YOU upgrade (not each user individually)

## 🎯 Current Features
- ✅ Centralized email service for all users
- ✅ Booking confirmations and notifications
- ✅ Quote emails to customers
- ✅ Password reset emails
- ✅ Email verification
- ✅ Error handling for failed email sends
- ✅ Graceful degradation (operations continue even if email fails)

## 🔧 Troubleshooting
- **"API key is invalid"**: Make sure you copied YOUR actual API key from resend.com
- **Email not sending**: Check your FROM_EMAIL domain is verified in YOUR Resend dashboard
- **Rate limits**: Your free account has limits - upgrade if you need more capacity
- **Missing RESEND_API_KEY**: Check your `.env` file has `RESEND_API_KEY=re_...`

## 🔐 Security Notes

- ✅ Keep your API key in `.env` file (never in code)
- ✅ Add `.env` to `.gitignore` (never commit secrets)
- ✅ Use environment variables in production (Vercel, Netlify, etc.)
- ✅ Only your backend code can access the API key
- ❌ Never expose the API key to frontend/client code

## 🌐 Domain Verification (Optional, for Production)

To send emails from YOUR domain (e.g., `noreply@yourcompany.com`):

1. Add your domain in YOUR Resend dashboard
2. Add the DNS records they provide
3. Wait for verification (usually a few minutes)
4. Update `FROM_EMAIL` in your `.env` file

For testing, you can use `onboarding@resend.dev` without verification.

---
*Last updated: November 2025*

**Remember:** One API key, all users. That's production quality! 🚀
