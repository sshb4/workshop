import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendPasswordResetEmail } from '@/lib/email'

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

    // Always return success to prevent email enumeration
    if (!teacher) {
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

        // Update teacher with reset token
    await prisma.teacher.update({
      where: { id: teacher.id },
      data: {
        resetToken,
        resetTokenExpiry
      } as {
        resetToken: string
        resetTokenExpiry: Date
      }
    })

    // Send password reset email
    try {
      const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`
      
      await sendPasswordResetEmail({
        to: email,
        teacherName: teacher.name,
        resetUrl
      })

      console.log('Password reset email sent to:', email)
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send password reset email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    )
  }
}
