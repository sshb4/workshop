// app/api/auth/signup/route.ts


console.log('Signup API route loaded')

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendEmailVerificationEmail } from '@/lib/email'


export async function POST(request: NextRequest) {
  try {
    // Print the database URL for debugging
    console.log('SIGNUP API DATABASE_URL:', process.env.DATABASE_URL)
    const body = await request.json()
    const { name, email, password, subdomain } = body

    // Validate required fields
    if (!name || !email || !password || !subdomain) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9-]+$/
    if (!subdomainRegex.test(subdomain)) {
      return NextResponse.json(
        { error: 'Subdomain can only contain lowercase letters, numbers, and hyphens' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordRequirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }

    const failedRequirements = []
    if (!passwordRequirements.minLength) failedRequirements.push('at least 8 characters')
    if (!passwordRequirements.hasUppercase) failedRequirements.push('one uppercase letter')
    if (!passwordRequirements.hasLowercase) failedRequirements.push('one lowercase letter')
    if (!passwordRequirements.hasNumber) failedRequirements.push('one number')
    if (!passwordRequirements.hasSpecialChar) failedRequirements.push('one special character')

    if (failedRequirements.length > 0) {
      return NextResponse.json(
        { error: `Password must contain: ${failedRequirements.join(', ')}` },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.teacher.findUnique({
      where: { email }
    })
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Check if subdomain already exists
    const existingSubdomain = await prisma.teacher.findUnique({
      where: { subdomain }
    })
    if (existingSubdomain) {
      return NextResponse.json(
        { error: 'This booking URL is already taken. Please choose a different one.' },
        { status: 409 }
      )
    }

    // Hash the password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now

    // Create the new teacher (email not verified initially)
    const newTeacher = await prisma.teacher.create({
      data: {
        name: name as string,
        email: email as string,
        passwordHash: hashedPassword,
        subdomain: subdomain as string,
        emailVerified: null, // Email not verified yet
        verificationToken: verificationToken,
        tokenExpiry: tokenExpiry
      }
    })

    // Create default booking settings with all form fields enabled
    try {
      await prisma.$executeRaw`
        INSERT INTO booking_settings (
          id, teacher_id, min_advance_booking, max_advance_booking, session_duration,
          buffer_time, allow_weekends, allow_same_day_booking, cancellation_policy,
          max_sessions_per_day, allow_customer_book, allow_manual_book, form_fields, created_at, updated_at
        ) VALUES (
          ${crypto.randomUUID()}, ${newTeacher.id}, 2, 30, 60, 15, true, false, 24, 8, true, true,
          ${JSON.stringify({
            name: true,
            email: true,
            phone: true,
            address: true,
            dates: true,
            description: true
          })}::jsonb, NOW(), NOW()
        )
      `
      console.log('Default booking settings created for new teacher')
    } catch (settingsError) {
      console.error('Failed to create default booking settings:', settingsError)
      // Don't fail the signup if booking settings creation fails
    }

    // Send verification email
    try {
      const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`
      
      await sendEmailVerificationEmail({
        to: email,
        teacherName: name,
        verificationUrl: verificationUrl
      })
      
      console.log('Verification email sent to:', email)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Don't fail signup if email fails - just log it
    }

    // Return success (don't return password hash)
    return NextResponse.json({
      success: true,
      message: 'Account created successfully! Please check your email to verify your account before logging in.',
      teacher: {
        id: newTeacher.id,
        name: newTeacher.name,
        email: newTeacher.email,
        subdomain: newTeacher.subdomain,
        emailVerified: false,
        requiresVerification: true
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}
