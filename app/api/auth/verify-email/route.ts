import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const email = searchParams.get('email')

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Missing verification token or email' },
        { status: 400 }
      )
    }

    // Find teacher with matching token and email
    const teacher = await prisma.teacher.findFirst({
      where: {
        email: email,
        verificationToken: token,
        tokenExpiry: {
          gt: new Date() // Token hasn't expired
        }
      } as any // Temporary type assertion until Prisma types refresh
    })

    if (!teacher) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    // Update teacher to mark email as verified
    await prisma.teacher.update({
      where: { id: teacher.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
        tokenExpiry: null
      } as any // Temporary type assertion until Prisma types refresh
    })

    // Redirect to success page
    return NextResponse.redirect(new URL('/admin/login?verified=true', request.url))

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find teacher
    const teacher = await prisma.teacher.findUnique({
      where: { email }
    })

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      )
    }

    if (teacher.emailVerified) {
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      )
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Update teacher with new token
    await prisma.teacher.update({
      where: { id: teacher.id },
      data: {
        verificationToken,
        tokenExpiry
      } as any // Temporary type assertion until Prisma types refresh
    })

    // Send verification email
    const { sendEmailVerificationEmail } = await import('@/lib/email')
    const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`

    await sendEmailVerificationEmail({
      to: email,
      teacherName: teacher.name,
      verificationUrl
    })

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully'
    })

  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    )
  }
}
