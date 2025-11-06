// app/api/booking-settings/route.ts

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: session.user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Default settings if none exist
    const defaultSettings = {
      minAdvanceBooking: 2,
      maxAdvanceBooking: 30,
      sessionDuration: 60,
      bufferTime: 15,
      allowWeekends: true,
      allowSameDayBooking: false,
      cancellationPolicy: 24,
      maxSessionsPerDay: 8,
      allowCustomerBook: true,
      allowManualBook: true
    }

    // Try to fetch booking settings using raw SQL
    let settings = defaultSettings
    try {
      interface BookingSettingsRow {
  min_advance_booking: number;
  max_advance_booking: number;
  session_duration: number;
  buffer_time: number;
  allow_weekends: boolean;
  allow_same_day_booking: boolean;
  cancellation_policy: number;
  max_sessions_per_day: number;
  allow_customer_book?: number;
  allow_manual_book?: number;
      }
      
      const bookingSettings = await prisma.$queryRaw`
        SELECT * FROM booking_settings WHERE teacher_id = ${session.user.id} LIMIT 1
      ` as BookingSettingsRow[]
      
      if (bookingSettings.length > 0) {
        const dbSettings = bookingSettings[0]
        settings = {
          minAdvanceBooking: dbSettings.min_advance_booking,
          maxAdvanceBooking: dbSettings.max_advance_booking,
          sessionDuration: dbSettings.session_duration,
          bufferTime: dbSettings.buffer_time,
          allowWeekends: dbSettings.allow_weekends,
          allowSameDayBooking: dbSettings.allow_same_day_booking,
          cancellationPolicy: dbSettings.cancellation_policy,
          maxSessionsPerDay: dbSettings.max_sessions_per_day,
          allowCustomerBook: dbSettings.allow_customer_book !== undefined ? !!dbSettings.allow_customer_book : true,
          allowManualBook: dbSettings.allow_manual_book !== undefined ? !!dbSettings.allow_manual_book : true
        }
      }
    } catch {
      console.log('Booking settings table may not exist yet, using defaults')
    }

    // Try to fetch blocked dates using raw SQL
    interface BlockedDateRow {
      id: string;
      start_date: Date;
      end_date: Date;
      reason: string;
      is_recurring: boolean;
      recurring_type: string | null;
    }
    
    interface BlockedDate {
      id: string;
      startDate: string;
      endDate: string;
      reason: string;
      isRecurring: boolean;
      recurringType: string | null;
    }
    
    let blockedDates: BlockedDate[] = []
    try {
      const dbBlockedDates = await prisma.$queryRaw`
        SELECT * FROM blocked_dates WHERE teacher_id = ${session.user.id} ORDER BY start_date ASC
      ` as BlockedDateRow[]
      
      blockedDates = dbBlockedDates.map(date => ({
        id: date.id,
        startDate: new Date(date.start_date).toISOString().split('T')[0],
        endDate: new Date(date.end_date).toISOString().split('T')[0],
        reason: date.reason,
        isRecurring: date.is_recurring,
        recurringType: date.recurring_type
      }))
    } catch {
      console.log('Blocked dates table may not exist yet, using empty array')
    }

    return NextResponse.json({
      settings: { ...settings, blockedDates }
    })
  } catch (error) {
    console.error('Error fetching booking settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { settings, blockedDates } = await request.json()

    // Use raw SQL to handle the database operations until Prisma client is regenerated
    // Upsert booking settings
    await prisma.$executeRaw`
      INSERT INTO booking_settings (
        id, teacher_id, min_advance_booking, max_advance_booking, session_duration,
        buffer_time, allow_weekends, allow_same_day_booking, cancellation_policy,
        max_sessions_per_day, allow_customer_book, allow_manual_book, created_at, updated_at
      ) VALUES (
        ${crypto.randomUUID()}, ${session.user.id}, ${settings.minAdvanceBooking}, 
        ${settings.maxAdvanceBooking}, ${settings.sessionDuration}, ${settings.bufferTime},
        ${settings.allowWeekends}, ${settings.allowSameDayBooking}, ${settings.cancellationPolicy},
  ${settings.maxSessionsPerDay}, ${settings.allowCustomerBook ? 1 : 0}, ${settings.allowManualBook ? 1 : 0}, NOW(), NOW()
      ) ON CONFLICT (teacher_id) DO UPDATE SET
        min_advance_booking = ${settings.minAdvanceBooking},
        max_advance_booking = ${settings.maxAdvanceBooking},
        session_duration = ${settings.sessionDuration},
        buffer_time = ${settings.bufferTime},
        allow_weekends = ${settings.allowWeekends},
        allow_same_day_booking = ${settings.allowSameDayBooking},
        cancellation_policy = ${settings.cancellationPolicy},
        max_sessions_per_day = ${settings.maxSessionsPerDay},
        allow_customer_book = ${settings.allowCustomerBook ? 1 : 0},
        allow_manual_book = ${settings.allowManualBook ? 1 : 0},
  updated_at = NOW()
    `

    // Delete existing blocked dates
    await prisma.$executeRaw`
      DELETE FROM blocked_dates WHERE teacher_id = ${session.user.id}
    `

    // Insert new blocked dates
    if (blockedDates && blockedDates.length > 0) {
      for (const date of blockedDates) {
        const startDateISO = new Date(date.startDate).toISOString()
        const endDateISO = new Date(date.endDate || date.startDate).toISOString()
        
        await prisma.$executeRawUnsafe(`
          INSERT INTO blocked_dates (
            id, teacher_id, start_date, end_date, reason, is_recurring, recurring_type,
            created_at, updated_at
          ) VALUES (
            '${crypto.randomUUID()}', '${session.user.id}', '${startDateISO}', 
            '${endDateISO}', '${date.reason}', ${date.isRecurring ? 1 : 0},
            ${date.recurringType ? `'${date.recurringType}'` : 'NULL'}, NOW(), NOW()
          )
        `)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving booking settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}