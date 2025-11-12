'use client'

import { useState, useMemo, useEffect } from 'react'

interface AvailabilitySlot {
  id: string
  title: string | null
  startDate: string
  endDate: string | null
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive: boolean
}

interface Teacher {
  id: string
  subdomain: string
  name: string
  hourlyRate?: number
  title?: string
}

interface ColorScheme {
  styles: {
    primary: string
    primaryLight: string
    accent: string
    background: string
    backgroundSecondary: string
    border: string
    textPrimary: string
    textSecondary: string
  }
}

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isPast: boolean
  availableSlots: AvailabilitySlot[]
  hasAvailability: boolean
  isToday: boolean
}

interface BookingCalendarProps {
  teacher: Teacher
  availabilitySlots: AvailabilitySlot[]
  colorScheme: ColorScheme
}

export default function BookingCalendar({ availabilitySlots, colorScheme }: BookingCalendarProps) {
  // Fetch form field settings from booking settings API
  const [formFields, setFormFields] = useState({
    name: true,
    email: true,
    phone: true,
    address: true,
    dates: true,
    description: true
  });
  useEffect(() => {
    async function fetchSettings() {
      try {
        // Add cache-busting query param
        const res = await fetch(`/api/booking-settings?nocache=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.settings?.formFields) {
            setFormFields(data.settings.formFields);
          }
        }
      } catch {}
    }
    fetchSettings();
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    dates: '',
    description: ''
  });
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Send booking request to backend
    setSubmitSuccess(true);
    setTimeout(() => {
      setShowBookingForm(false);
      setSubmitSuccess(false);
    }, 2000);
  };
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [currentMonth] = useState(new Date())

  // Generate calendar days with available/blocked status
  const calendarDays = useMemo((): CalendarDay[] => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    const days: CalendarDay[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)
      const isCurrentMonth = currentDate.getMonth() === currentMonth.getMonth()
      const isPast = currentDate < today
      const isToday = currentDate.toDateString() === today.toDateString()
      const availableSlots = availabilitySlots.filter(slot => {
        const slotStart = new Date(slot.startDate)
        const slotEnd = slot.endDate ? new Date(slot.endDate) : null
        const isAfterStart = currentDate >= slotStart
        const isBeforeEnd = !slotEnd || currentDate <= slotEnd
        return slot.dayOfWeek === currentDate.getDay() && slot.isActive && isAfterStart && isBeforeEnd
      })
      const hasAvailability = availableSlots.length > 0
      days.push({
        date: currentDate,
        isCurrentMonth,
        isPast,
        availableSlots,
        hasAvailability,
        isToday
      })
    }
    return days
  }, [currentMonth, availabilitySlots])

  return (
    <>
      {/* Calendar Views */}
      <div className="mb-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-3">
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
            <div 
              key={day}
              className="text-center font-semibold py-3 rounded-lg"
              style={{ color: colorScheme.styles.textPrimary, backgroundColor: colorScheme.styles.backgroundSecondary }}
            >
              <div className="text-sm">{day.slice(0, 3)}</div>
              <div className="text-xs opacity-60">{day.slice(3)}</div>
            </div>
          ))}
        </div>

        {/* Calendar Days - Only show available/blocked status */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => (
            <div
              key={day.date.toISOString()}
              className="aspect-square p-2 rounded-lg transition-all duration-200 relative min-h-16 flex flex-col items-center justify-center group"
              style={{ 
                backgroundColor: day.hasAvailability && !day.isPast && day.isCurrentMonth
                  ? colorScheme.styles.backgroundSecondary
                  : 'transparent',
                color: day.isToday
                  ? colorScheme.styles.primary
                  : !day.isCurrentMonth || day.isPast
                  ? colorScheme.styles.textSecondary + '40'
                  : colorScheme.styles.textPrimary,
                border: `2px solid ${
                  day.isToday 
                    ? colorScheme.styles.accent 
                    : 'transparent'
                }`
              }}
            >
              <div className="absolute top-1 left-1 text-xs font-bold opacity-80">
                {day.date.getDate()}
              </div>
              {day.hasAvailability && !day.isPast && day.isCurrentMonth && (
                <div className="flex flex-col items-center justify-center mt-4 w-full">
                  <span className="text-xs font-medium text-green-600">Available</span>
                </div>
              )}
              {!day.hasAvailability && !day.isPast && day.isCurrentMonth && (
                <div className="flex flex-col items-center justify-center mt-4 w-full">
                  <span className="text-xs font-medium text-red-500">Blocked</span>
                </div>
              )}
              {day.isToday && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full" 
                     style={{ backgroundColor: colorScheme.styles.accent }}>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Book Button and Booking Form */}
      <div className="flex justify-center mt-8">
        <button
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold text-lg hover:bg-indigo-700 transition"
          onClick={() => setShowBookingForm(true)}
        >
          Book
        </button>
      </div>

      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Booking Request Form</h3>
            <p className="text-sm text-gray-600 mb-4">Please fill out the form to request a booking. The teacher will contact you to confirm details.</p>
            {submitSuccess ? (
              <div className="text-green-600 font-semibold text-center py-4">Booking request sent!</div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {formFields.name && (
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                )}
                {formFields.email && (
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                )}
                {formFields.phone && (
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                )}
                {formFields.address && (
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                )}
                {formFields.dates && (
                  <div>
                    <label htmlFor="dates" className="block text-sm font-medium text-gray-700 mb-1">Date(s) Requested</label>
                    <input
                      type="text"
                      id="dates"
                      name="dates"
                      value={formData.dates}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g. Nov 10, Nov 12"
                    />
                  </div>
                )}
                {formFields.description && (
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      rows={3}
                    />
                  </div>
                )}
                {submitError && (
                  <div className="text-red-600 text-sm">{submitError}</div>
                )}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    className="w-1/2 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold text-lg hover:bg-gray-300 transition"
                    onClick={() => setShowBookingForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-3 bg-indigo-600 text-white rounded-lg font-semibold text-lg hover:bg-indigo-700 transition"
                  >
                    Submit
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}