// app/api/auth/signup/route.ts

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

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

    // Check minimum password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
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

    // Create the new teacher
    const newTeacher = await prisma.teacher.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        subdomain,
      } as any // Temporary type bypass until Prisma types are fixed
    })

    // Return success (don't return password hash)
    return NextResponse.json({
      success: true,
      teacher: {
        id: newTeacher.id,
        name: newTeacher.name,
        email: newTeacher.email,
        subdomain: newTeacher.subdomain,
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
