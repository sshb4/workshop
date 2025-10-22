// app/api/health/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('Health check: Testing database connection...')
    
    // Test database connection
    await prisma.$connect()
    console.log('Health check: Database connection successful')
    
    // Test a simple query
    const teacherCount = await prisma.teacher.count()
    console.log('Health check: Teacher count query successful:', teacherCount)
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      teacherCount,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
