// app/api/auth/signup/route.ts

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendEmailVerificationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
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

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create the new teacher
    const newTeacher = await prisma.teacher.create({
      data: {
        name: name as string,
        email: email as string,
        passwordHash: hashedPassword,
        subdomain: subdomain as string,
        verificationToken,
        tokenExpiry,
        emailVerified: null // Not verified yet
      } as any // Temporary type assertion until Prisma types refresh
    })

    // Send verification email
    try {
      const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`
      
      await sendEmailVerificationEmail({
        to: email,
        teacherName: name,
        verificationUrl
      })

      console.log('Verification email sent to:', email)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Don't fail signup if email fails - user can resend later
    }

    // Return success (don't return password hash)
    return NextResponse.json({
      success: true,
      message: 'Account created successfully! Please check your email to verify your account.',
      teacher: {
        id: newTeacher.id,
        name: newTeacher.name,
        email: newTeacher.email,
        subdomain: newTeacher.subdomain,
        emailVerified: false
      }
    })

  } catch (error) {
    console.error('Signup error:', error)
    
    // Handle Prisma unique constraint errors
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      if (error.message.includes('email')) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        )
      }
      if (error.message.includes('subdomain')) {
        return NextResponse.json(
          { error: 'This booking URL is already taken' },
          { status: 409 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}
