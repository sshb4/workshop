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

    console.log('Processing password reset request for:', email)

    // Find teacher
    const teacher = await prisma.teacher.findUnique({
      where: { email }
    })

    // Always return success to prevent email enumeration
    if (!teacher) {
      console.log('No teacher found with email:', email)
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      })
    }

    console.log('Teacher found, generating reset token for:', teacher.id)

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    console.log('Updating teacher with reset token...')
    
    // Update teacher with reset token
    try {
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
      console.log('Teacher updated successfully with reset token')
    } catch (dbError) {
      console.error('Database update failed:', dbError)
      throw new Error('Database update failed: ' + (dbError instanceof Error ? dbError.message : 'Unknown error'))
    }

    // Send password reset email
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const resetUrl = `${baseUrl}/admin/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`
      
      console.log('Sending password reset email with URL:', resetUrl.replace(resetToken, '[TOKEN]'))
      
      const emailResult = await sendPasswordResetEmail({
        to: email,
        teacherName: teacher.name,
        resetUrl
      })

      if (!emailResult.success) {
        console.error('Failed to send password reset email:', emailResult.error)
        // Don't return error here - still consider the operation successful
        // The user will think the email was sent, but we'll log the issue
      }

      console.log('Password reset email process completed for:', email)
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
      // Don't return error here - continue with success response
      // This prevents the operation from failing if email service is down
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
