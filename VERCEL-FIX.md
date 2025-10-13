# Vercel Deployment Fix for Authentication Error

## 🚨 Current Issue
Getting error: `https://workshop-edwzz2rhq-ssh-expitrans-projects.vercel.app/api/auth/error`

## ✅ Step-by-Step Fix

### 1. Set Environment Variables on Vercel

Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

Add these 3 variables:

```
Name: NEXTAUTH_SECRET
Value: 8f9e5c2d1a3b7f4e9c8d2a5b6e3f9c1d7a4b8e5f2c9d6a3b7e4f9c2d5a8b1e6f3c9d2a7b4e8f5c1d6a9b2e7f4c8d5a1b3e6f9c2d7a4b8e5f1c6a9b3e2d7f4c8
Environment: Production, Preview, Development
```

```
Name: NEXTAUTH_URL  
Value: https://workshop-edwzz2rhq-ssh-expitrans-projects.vercel.app
Environment: Production, Preview
```

```
Name: DATABASE_URL
Value: file:./prisma/dev.db
Environment: Production, Preview, Development
```

### 2. Redeploy Your App

After setting the environment variables:
1. Go to your Vercel dashboard
2. Click "Redeploy" or push a new commit to trigger deployment

### 3. Test the Fix

1. Go to your Vercel URL: https://workshop-edwzz2rhq-ssh-expitrans-projects.vercel.app
2. Try to log in with your credentials
3. Should redirect to dashboard instead of error page

## 🔍 Common Issues & Solutions

**Issue**: Still getting auth errors
**Solution**: Make sure you're using the exact same credentials that work locally

**Issue**: Database not found
**Solution**: Make sure your database file is included in the deployment (check .gitignore)

**Issue**: Different Vercel URL
**Solution**: Update NEXTAUTH_URL with your actual Vercel deployment URL

## 🧪 Testing Locally vs Production

**Local URL**: http://localhost:3000
**Vercel URL**: https://workshop-edwzz2rhq-ssh-expitrans-projects.vercel.app

Make sure you're testing on the correct URL for each environment!