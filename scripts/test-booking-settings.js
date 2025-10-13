// scripts/test-booking-settings.js
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testBookingSettings() {
  try {
    console.log('Testing booking settings database persistence...')
    
    // Test saving booking settings
    const testTeacherId = 'cmgjpoa6m00008l57nmphsmly' // Sasha Bates
    const testSettings = {
      minAdvanceBooking: 3,
      maxAdvanceBooking: 21,
      sessionDuration: 90,
      bufferTime: 10,
      allowWeekends: false,
      allowSameDayBooking: true,
      cancellationPolicy: 48,
      maxSessionsPerDay: 5
    }
    
    console.log('1. Saving test booking settings...')
    await prisma.$executeRaw`
      INSERT INTO booking_settings (
        id, teacher_id, min_advance_booking, max_advance_booking, session_duration,
        buffer_time, allow_weekends, allow_same_day_booking, cancellation_policy,
        max_sessions_per_day, created_at, updated_at
      ) VALUES (
        ${'test-settings-123'}, ${testTeacherId}, ${testSettings.minAdvanceBooking}, 
        ${testSettings.maxAdvanceBooking}, ${testSettings.sessionDuration}, ${testSettings.bufferTime},
        ${testSettings.allowWeekends}, ${testSettings.allowSameDayBooking}, ${testSettings.cancellationPolicy},
        ${testSettings.maxSessionsPerDay}, datetime('now'), datetime('now')
      ) ON CONFLICT (teacher_id) DO UPDATE SET
        min_advance_booking = ${testSettings.minAdvanceBooking},
        max_advance_booking = ${testSettings.maxAdvanceBooking},
        session_duration = ${testSettings.sessionDuration},
        buffer_time = ${testSettings.bufferTime},
        allow_weekends = ${testSettings.allowWeekends},
        allow_same_day_booking = ${testSettings.allowSameDayBooking},
        cancellation_policy = ${testSettings.cancellationPolicy},
        max_sessions_per_day = ${testSettings.maxSessionsPerDay},
        updated_at = datetime('now')
    `
    
    console.log('2. Reading back booking settings...')
    const savedSettings = await prisma.$queryRaw`
      SELECT * FROM booking_settings WHERE teacher_id = ${testTeacherId}
    ` 
    console.log('Saved settings:', savedSettings)
    
    console.log('3. Testing blocked dates with date ranges...')
    const testBlockedDates = [
      {
        id: 'test-blocked-1',
        startDate: '2025-12-20',
        endDate: '2025-12-25',
        reason: 'Holiday Break',
        isRecurring: false,
        recurringType: null
      },
      {
        id: 'test-blocked-2', 
        startDate: '2025-11-15',
        endDate: '2025-11-15',
        reason: 'Conference',
        isRecurring: false,
        recurringType: null
      }
    ]
    
    // Delete existing test blocked dates
    await prisma.$executeRaw`
      DELETE FROM blocked_dates WHERE teacher_id = ${testTeacherId}
    `
    
    // Insert test blocked dates
    for (const date of testBlockedDates) {
      const startDateISO = new Date(date.startDate).toISOString()
      const endDateISO = new Date(date.endDate).toISOString()
      
      await prisma.$executeRawUnsafe(`
        INSERT INTO blocked_dates (
          id, teacher_id, start_date, end_date, reason, is_recurring, recurring_type,
          created_at, updated_at
        ) VALUES (
          '${date.id}', '${testTeacherId}', '${startDateISO}', 
          '${endDateISO}', '${date.reason}', ${date.isRecurring ? 1 : 0},
          ${date.recurringType ? `'${date.recurringType}'` : 'NULL'}, datetime('now'), datetime('now')
        )
      `)
    }
    
    console.log('4. Reading back blocked dates...')
    const savedBlockedDates = await prisma.$queryRaw`
      SELECT * FROM blocked_dates WHERE teacher_id = ${testTeacherId} ORDER BY start_date ASC
    `
    console.log('Saved blocked dates:', savedBlockedDates)
    
    console.log('✅ Database persistence test completed successfully!')
    
    // Clean up test data
    console.log('5. Cleaning up test data...')
    await prisma.$executeRaw`DELETE FROM booking_settings WHERE teacher_id = ${testTeacherId}`
    await prisma.$executeRaw`DELETE FROM blocked_dates WHERE teacher_id = ${testTeacherId}`
    
  } catch (error) {
    console.error('❌ Database persistence test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testBookingSettings()