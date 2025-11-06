// app/api/auth/signup/route.ts


console.log('Signup API route loaded')
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendEmailVerificationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  console.log('Signup API POST handler running')
  return NextResponse.json({
    success: true,
    message: 'Static response: API handler is working.'
  })
}
