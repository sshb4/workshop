// app/api/auth/signup/route.ts

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendEmailVerificationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    console.log('Signup API called')
    const body = await request.json()
    console.log('Request body parsed:', { ...body, password: '[REDACTED]' })
    
    const { name, email, password, subdomain } = body

    // Validate required fields
    if (!name || !email || !password || !subdomain) {
      console.log('Missing required fields')
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
    console.log('Checking if email exists:', email)
    const existingUser = await prisma.teacher.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log('Email already exists')
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Check if subdomain already exists
    console.log('Checking if subdomain exists:', subdomain)
    const existingSubdomain = await prisma.teacher.findUnique({
      where: { subdomain }
    })

    if (existingSubdomain) {
      console.log('Subdomain already exists')
      return NextResponse.json(
        { error: 'This booking URL is already taken. Please choose a different one.' },
        { status: 409 }
      )
    }

    // Hash the password
    console.log('Hashing password')
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Generate email verification token
    console.log('Generating verification token')
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create the new teacher
    console.log('Creating teacher in database')
    const newTeacher = await prisma.teacher.create({
      data: {
        name: name as string,
        email: email as string,
        passwordHash: hashedPassword,
        subdomain: subdomain as string,
        emailVerified: new Date() // Auto-verify for production compatibility
      }
    })
    console.log('Teacher created successfully:', newTeacher.id)    // Send verification email
    try {
      console.log('Skipping verification email for production compatibility')
      // TODO: Re-enable when production database has verification fields
      /*
      console.log('Attempting to send verification email')
      const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`
      console.log('Verification URL:', verificationUrl)
      
      await sendEmailVerificationEmail({
        to: email,
        teacherName: name,
        verificationUrl
      })

      console.log('Verification email sent successfully to:', email)
      */
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Don't fail signup if email fails - user can resend later
    }

    console.log('Signup completed successfully')
    // Return success (don't return password hash)
    return NextResponse.json({
      success: true,
      message: 'Account created successfully! You can now log in.',
      teacher: {
        id: newTeacher.id,
        name: newTeacher.name,
        email: newTeacher.email,
        subdomain: newTeacher.subdomain,
        emailVerified: true
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
    
    // Log the full error for debugging
    console.error('Full error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error type'
    })
    
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}
