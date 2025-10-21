// Temporary simple signup without email verification for debugging
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('Simple signup API called')
    const body = await request.json()
    console.log('Request body parsed')
    
    const { name, email, password, subdomain } = body

    // Validate required fields
    if (!name || !email || !password || !subdomain) {
      console.log('Missing required fields')
      return NextResponse.json(
        { error: 'All fields are required' },
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

    // Hash the password
    console.log('Hashing password')
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create the new teacher (basic version)
    console.log('Creating teacher in database')
    const newTeacher = await prisma.teacher.create({
      data: {
        name: name as string,
        email: email as string,
        passwordHash: hashedPassword,
        subdomain: subdomain as string,
        emailVerified: new Date() // Auto-verify for now
      }
    })
    console.log('Teacher created successfully:', newTeacher.id)

    console.log('Signup completed successfully')
    return NextResponse.json({
      success: true,
      message: 'Account created successfully!',
      teacher: {
        id: newTeacher.id,
        name: newTeacher.name,
        email: newTeacher.email,
        subdomain: newTeacher.subdomain,
        emailVerified: true
      }
    })

  } catch (error) {
    console.error('Simple signup error:', error)
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
