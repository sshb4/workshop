// app/api/profile/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Get form data
    const formData = await request.formData()
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const hourlyRateStr = formData.get('hourlyRate') as string
    const hourlyRate = hourlyRateStr && hourlyRateStr.trim() !== '' ? parseFloat(hourlyRateStr) : NaN
    const subdomain = formData.get('subdomain') as string
    const title = formData.get('title') as string
    const bio = formData.get('bio') as string
    const profileImage = formData.get('profileImage') as string
    const colorScheme = formData.get('colorScheme') as string

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Validate subdomain format if provided (lowercase letters, numbers, hyphens only)
    if (subdomain) {
      const subdomainRegex = /^[a-z0-9-]+$/
      if (!subdomainRegex.test(subdomain)) {
        return NextResponse.json(
          { error: 'Subdomain can only contain lowercase letters, numbers, and hyphens' },
          { status: 400 }
        )
      }
    }

    // Validate hourly rate if provided
    if (!isNaN(hourlyRate) && (hourlyRate <= 0 || hourlyRate > 10000)) {
      return NextResponse.json(
        { error: 'Hourly rate must be between $0.01 and $10,000' },
        { status: 400 }
      )
    }

    // Check if email is already taken by another user
    const existingEmailUser = await prisma.teacher.findFirst({
      where: {
        email: email,
        NOT: {
          id: session.user.id,
        },
      },
    })

    if (existingEmailUser) {
      return NextResponse.json(
        { error: 'This email is already in use by another account' },
        { status: 400 }
      )
    }

    // Check if subdomain is already taken by another user (only if subdomain is provided)
    if (subdomain) {
      const existingSubdomainUser = await prisma.teacher.findFirst({
        where: {
          subdomain: subdomain,
          NOT: {
            id: session.user.id,
          },
        },
      })

      if (existingSubdomainUser) {
        return NextResponse.json(
          { error: 'This subdomain is already taken. Please choose another one.' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: {
      name: string
      email: string
      subdomain?: string
      hourlyRate?: number
      title: string | null
      bio: string | null
      profileImage: string | null
      colorScheme: string
      phone?: string | null
    } = {
      name,
      email,
      title: title && title.trim() !== '' ? title : null,
      bio: bio && bio.trim() !== '' ? bio : null,
      profileImage: profileImage && profileImage.trim() !== '' ? profileImage : null,
      colorScheme: colorScheme || 'default',
    }

    // Only update subdomain if provided
    if (subdomain) {
      updateData.subdomain = subdomain
    }

    // Update hourlyRate - only include in update if we want to change it
    if (hourlyRateStr && hourlyRateStr.trim() !== '') {
      // Field has a value, parse and validate it
      if (!isNaN(hourlyRate) && hourlyRate > 0) {
        updateData.hourlyRate = hourlyRate
      }
    } else {
      // Field is empty, explicitly set to undefined to clear existing value
      updateData.hourlyRate = undefined
    }

    // Only update phone if provided
    if (phone && phone.trim() !== '') {
      updateData.phone = phone.trim()
    } else {
      updateData.phone = null
    }

    // Update teacher profile
    const updatedTeacher = await prisma.teacher.update({
      where: { id: session.user.id },
      data: updateData,
    })

    console.log('Profile updated for teacher:', updatedTeacher.id)

    // Redirect back to profile page with success
    return NextResponse.redirect(new URL('/admin/profile?updated=true', request.url))

  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
