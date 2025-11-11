// Create default booking settings for existing teachers
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function createDefaultBookingSettings() {
  try {
    console.log('Looking for teachers without booking settings...')
    
    // Find teachers who don't have booking settings
    const teachersWithoutSettings = await prisma.teacher.findMany({
      where: {
        bookingSettings: null
      },
      select: {
        id: true,
        name: true,
        subdomain: true
      }
    })
    
    console.log(`Found ${teachersWithoutSettings.length} teachers without booking settings`)
    
    for (const teacher of teachersWithoutSettings) {
      try {
        console.log(`Creating default settings for ${teacher.name} (${teacher.subdomain})...`)
        
        await prisma.$executeRaw`
          INSERT INTO booking_settings (
            id, teacher_id, min_advance_booking, max_advance_booking, session_duration,
            buffer_time, allow_weekends, allow_same_day_booking, cancellation_policy,
            max_sessions_per_day, allow_customer_book, allow_manual_book, form_fields, created_at, updated_at
          ) VALUES (
            ${crypto.randomUUID()}, ${teacher.id}, 2, 30, 60, 15, true, false, 24, 8, true, true,
            ${JSON.stringify({
              name: true,
              email: true,
              phone: true,
              address: true,
              dates: true,
              description: true
            })}::jsonb, NOW(), NOW()
          )
        `
        
        console.log(`✓ Created default settings for ${teacher.name}`)
      } catch (error) {
        console.error(`✗ Failed to create settings for ${teacher.name}:`, error)
      }
    }
    
    console.log('Done!')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createDefaultBookingSettings()
