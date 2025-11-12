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
      allowManualBook: true,
      formFields: {
        name: true,
        email: true,
        phone: true,
        address: true,
        dates: true,
        description: true
      }
    }

    // Try to fetch booking settings using raw SQL
    let settings = defaultSettings
    try {
      const bookingSettings = await prisma.bookingSettings.findUnique({
        where: { teacherId: session.user.id }
      })
      
      if (bookingSettings) {
        interface ExtendedBookingSettings {
          allowCustomerBook?: boolean;
          allowManualBook?: boolean;
          formFields?: string;
        }
        const extendedSettings = bookingSettings as typeof bookingSettings & ExtendedBookingSettings
        settings = {
          minAdvanceBooking: bookingSettings.minAdvanceBooking,
          maxAdvanceBooking: bookingSettings.maxAdvanceBooking,
          sessionDuration: bookingSettings.sessionDuration,
          bufferTime: bookingSettings.bufferTime,
          allowWeekends: bookingSettings.allowWeekends,
          allowSameDayBooking: bookingSettings.allowSameDayBooking,
          cancellationPolicy: bookingSettings.cancellationPolicy,
          maxSessionsPerDay: bookingSettings.maxSessionsPerDay,
          allowCustomerBook: extendedSettings.allowCustomerBook ?? true,
          allowManualBook: extendedSettings.allowManualBook ?? true,
          formFields: extendedSettings.formFields ? JSON.parse(extendedSettings.formFields) : defaultSettings.formFields
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

    // Upsert booking settings using Prisma methods (only existing fields for now)
    await prisma.bookingSettings.upsert({
      where: { teacherId: session.user.id },
      create: {
        teacherId: session.user.id,
        minAdvanceBooking: settings.minAdvanceBooking,
        maxAdvanceBooking: settings.maxAdvanceBooking,
        sessionDuration: settings.sessionDuration,
        bufferTime: settings.bufferTime,
        allowWeekends: settings.allowWeekends,
        allowSameDayBooking: settings.allowSameDayBooking,
        cancellationPolicy: settings.cancellationPolicy,
        maxSessionsPerDay: settings.maxSessionsPerDay
      },
      update: {
        minAdvanceBooking: settings.minAdvanceBooking,
        maxAdvanceBooking: settings.maxAdvanceBooking,
        sessionDuration: settings.sessionDuration,
        bufferTime: settings.bufferTime,
        allowWeekends: settings.allowWeekends,
        allowSameDayBooking: settings.allowSameDayBooking,
        cancellationPolicy: settings.cancellationPolicy,
        maxSessionsPerDay: settings.maxSessionsPerDay
      }
    })

    // Delete existing blocked dates
    await prisma.blockedDate.deleteMany({
      where: { teacherId: session.user.id }
    })

    // Insert new blocked dates
    if (blockedDates && blockedDates.length > 0) {
      interface BlockedDateInput {
        startDate: string;
        endDate?: string;
        reason: string;
        isRecurring?: boolean;
        recurringType?: string | null;
      }
      
      const blockedDatesData = (blockedDates as BlockedDateInput[]).map(date => ({
        teacherId: session.user.id,
        startDate: new Date(date.startDate),
        endDate: new Date(date.endDate || date.startDate),
        reason: date.reason,
        isRecurring: date.isRecurring || false,
        recurringType: date.recurringType || null
      }))
      
      await prisma.blockedDate.createMany({
        data: blockedDatesData
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving booking settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}