// lib/booking-sync.ts
interface ExternalBookingAPI {
  businessId: string
  adminId: string
  apiKey: string
  baseUrl: string
}

export class BookingSyncService {
  constructor(private config: ExternalBookingAPI) {}

  // Sync booking TO external system
  async syncBookingToExternal(booking: any) {
    try {
      const response = await fetch(`${this.config.baseUrl}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          business_id: this.config.businessId,
          admin_id: this.config.adminId,
          student_name: booking.studentName,
          student_email: booking.studentEmail,
          student_phone: booking.studentPhone,
          booking_date: booking.bookingDate,
          start_time: booking.startTime,
          end_time: booking.endTime,
          amount_paid: booking.amountPaid,
          payment_status: booking.paymentStatus,
          notes: booking.notes,
        }),
      })

      if (!response.ok) {
        throw new Error(`External API error: ${response.statusText}`)
      }

      const result = await response.json()
      return result.booking_id // Return external booking ID
    } catch (error) {
      console.error('Failed to sync booking to external system:', error)
      throw error
    }
  }

  // Get bookings FROM external system
  async fetchExternalBookings(teacherId: string) {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/bookings?business_id=${this.config.businessId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`External API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.bookings
    } catch (error) {
      console.error('Failed to fetch external bookings:', error)
      throw error
    }
  }

  // Update booking status in external system
  async updateExternalBookingStatus(externalBookingId: string, status: string) {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/bookings/${externalBookingId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify({
            payment_status: status,
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`External API error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to update external booking status:', error)
      throw error
    }
  }
}

// Usage example
export function createSyncService(teacher: any): BookingSyncService {
  return new BookingSyncService({
    businessId: teacher.externalBusinessId,
    adminId: teacher.externalAdminId,
    apiKey: process.env.EXTERNAL_BOOKING_API_KEY!,
    baseUrl: process.env.EXTERNAL_BOOKING_API_URL!,
  })
}
