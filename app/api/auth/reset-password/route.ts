import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { token, email, newPassword } = await request.json()

    if (!token || !email || !newPassword) {
      return NextResponse.json(
        { error: 'Token, email, and new password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordRequirements = {
      minLength: newPassword.length >= 8,
      hasUppercase: /[A-Z]/.test(newPassword),
      hasLowercase: /[a-z]/.test(newPassword),
      hasNumber: /\d/.test(newPassword),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
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

        // Find teacher with valid reset token
    const teacher = await prisma.teacher.findFirst({
      where: {
        email: email,
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date() // Token hasn't expired
        }
      } as {
        email: string
        resetToken: string
        resetTokenExpiry: { gt: Date }
      }
    })

    if (!teacher) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

        // Update teacher with new password and clear reset token
    await prisma.teacher.update({
      where: { id: teacher.id },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      } as {
        passwordHash: string
        resetToken: null
        resetTokenExpiry: null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
