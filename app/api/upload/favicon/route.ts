// app/api/upload/favicon/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import sharp from 'sharp'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('favicon') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image (PNG, JPG, JPEG, GIF, or ICO)' },
        { status: 400 }
      )
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 2MB' },
        { status: 400 }
      )
    }

    // Get user's subdomain for filename
    const teacher = await prisma.teacher.findUnique({
      where: { id: session.user.id },
      select: { subdomain: true }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Process image with Sharp to create favicon
    const faviconFiles: string[] = []

    try {
      // Create ICO file with multiple sizes
      const icoBuffer = await sharp(buffer)
        .resize(32, 32)
        .toFormat('png')
        .toBuffer()

      // Save as PNG (modern browsers prefer this)
      const pngBuffer = await sharp(buffer)
        .resize(32, 32)
        .png()
        .toBuffer()

      // Create filenames
      const timestamp = Date.now()
      const icoFilename = `${teacher.subdomain}-favicon-${timestamp}.ico`
      const pngFilename = `${teacher.subdomain}-favicon-${timestamp}.png`

      // Save files to public/favicons directory
      const faviconDir = path.join(process.cwd(), 'public', 'favicons')
      
      // Create directory if it doesn't exist
      await writeFile(path.join(faviconDir, 'placeholder.txt'), '').catch(() => {
        // Directory might not exist, create it by writing a file
      })

      // Save ICO file
      await writeFile(path.join(faviconDir, icoFilename), icoBuffer)
      faviconFiles.push(`/favicons/${icoFilename}`)

      // Save PNG file
      await writeFile(path.join(faviconDir, pngFilename), pngBuffer)
      faviconFiles.push(`/favicons/${pngFilename}`)

      // Update teacher's favicon in database
      const faviconUrl = `/favicons/${pngFilename}` // Use PNG as primary
      await prisma.teacher.update({
        where: { id: session.user.id },
        data: { favicon: faviconUrl }
      })

      return NextResponse.json({
        success: true,
        faviconUrl,
        message: 'Favicon uploaded and processed successfully'
      })

    } catch (imageError) {
      console.error('Image processing error:', imageError)
      return NextResponse.json(
        { error: 'Failed to process image. Please ensure it\'s a valid image file.' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Favicon upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
