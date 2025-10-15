'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'

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

interface BookingCalendarProps {
  teacher: Teacher
  availabilitySlots: AvailabilitySlot[]
  colorScheme: ColorScheme
}

interface SelectedSlot {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  dayName: string
  customStartTime?: string
  customEndTime?: string
  date?: Date
  duration?: number
}

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isPast: boolean
  availableSlots: AvailabilitySlot[]
  hasAvailability: boolean
  isSelected: boolean
  isToday: boolean
}

type ViewMode = 'month' | 'week' | 'list'

const daysOfWeek = [
  { id: 0, name: 'Sunday' },
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' },
]

export default function BookingCalendar({ teacher, availabilitySlots, colorScheme }: BookingCalendarProps) {
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([])
  const [showTimeSelector, setShowTimeSelector] = useState(false)
  const [currentSlot, setCurrentSlot] = useState<AvailabilitySlot | null>(null)
  const [customStartTime, setCustomStartTime] = useState('')
  const [customEndTime, setCustomEndTime] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [timeSlotDuration, setTimeSlotDuration] = useState(30) // minutes
  const [showAvailabilityOnly, setShowAvailabilityOnly] = useState(true)
  const [selectedTimeZone, setSelectedTimeZone] = useState('local')
  const [showBookingDetails, setShowBookingDetails] = useState(false)
  const router = useRouter()

  // Get user's timezone
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  // Helper function to check if a specific date is available
  const isDateAvailable = (date: Date, dayOfWeek: number): AvailabilitySlot[] => {
    const availableSlots = availabilitySlots.filter(slot => {
      // Check if the day of week matches
      if (slot.dayOfWeek !== dayOfWeek || !slot.isActive) return false
      
      // Check if the date is within the availability period
      const slotStart = new Date(slot.startDate)
      const slotEnd = slot.endDate ? new Date(slot.endDate) : null
      
      // Date should be >= start date and <= end date (if end date exists)
      const isAfterStart = date >= slotStart
      const isBeforeEnd = !slotEnd || date <= slotEnd
      
      return isAfterStart && isBeforeEnd
    })
    
    return availableSlots
  }

  // Get available slots for the selected date
  const getAvailableSlotsForDate = (date: Date): AvailabilitySlot[] => {
    const dayOfWeek = date.getDay()
    return isDateAvailable(date, dayOfWeek)
  }

  // Generate time intervals based on selected duration
  const generateTimeOptions = (startTime: string, endTime: string, duration: number = timeSlotDuration) => {
    const options = []
    const start = new Date(`2000-01-01T${startTime}:00`)
    const end = new Date(`2000-01-01T${endTime}:00`)
    
    const current = new Date(start)
    while (current < end) {
      options.push(current.toTimeString().slice(0, 5))
      current.setMinutes(current.getMinutes() + duration)
    }
    options.push(endTime) // Add the end time as final option
    
    return options
  }

  // Calculate booking duration in hours
  const calculateDuration = (start: string, end: string): number => {
    const startTime = new Date(`2000-01-01T${start}:00`)
    const endTime = new Date(`2000-01-01T${end}:00`)
    return (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
  }

  // Generate calendar days with enhanced data
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
      const availableSlots = getAvailableSlotsForDate(currentDate)
      const hasAvailability = availableSlots.length > 0
      const isSelected = selectedDate?.toDateString() === currentDate.toDateString()
      
      days.push({
        date: currentDate,
        isCurrentMonth,
        isPast,
        availableSlots,
        hasAvailability,
        isSelected,
        isToday
      })
    }
    
    return days
  }, [currentMonth, selectedDate, availabilitySlots])

  // Get upcoming available dates
  const upcomingDates = useMemo(() => {
    const today = new Date()
    const next30Days = []
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const slots = getAvailableSlotsForDate(date)
      if (slots.length > 0) {
        next30Days.push({ date, slots })
      }
    }
    
    return next30Days
  }, [availabilitySlots])

  const handleSlotClick = (slot: AvailabilitySlot, date?: Date) => {
    setCurrentSlot(slot)
    setCustomStartTime(slot.startTime)
    
    // Auto-set end time based on selected duration
    const startTime = new Date(`2000-01-01T${slot.startTime}:00`)
    const endTime = new Date(startTime.getTime() + (timeSlotDuration * 60 * 1000))
    const maxEndTime = new Date(`2000-01-01T${slot.endTime}:00`)
    
    const finalEndTime = endTime > maxEndTime ? maxEndTime : endTime
    setCustomEndTime(finalEndTime.toTimeString().slice(0, 5))
    
    setShowTimeSelector(true)
  }

  const handleTimeSelection = () => {
    if (!currentSlot || !selectedDate) return
    
    const dayName = daysOfWeek.find(day => day.id === currentSlot.dayOfWeek)?.name || ''
    const duration = calculateDuration(customStartTime, customEndTime)
    
    const selectedSlot: SelectedSlot = {
      ...currentSlot,
      dayName,
      customStartTime,
      customEndTime,
      date: selectedDate,
      duration
    }

    setSelectedSlots(prev => {
      const existingIndex = prev.findIndex(s => 
        s.id === currentSlot.id && 
        s.date?.toDateString() === selectedDate?.toDateString()
      )
      if (existingIndex >= 0) {
        // Update existing selection with new times
        const newSlots = [...prev]
        newSlots[existingIndex] = selectedSlot
        return newSlots
      } else {
        // Add new selection
        return [...prev, selectedSlot]
      }
    })
    
    setShowTimeSelector(false)
    setCurrentSlot(null)
  }

  const handleQuickTimeSelect = (minutes: number) => {
    if (!currentSlot) return
    
    const startTime = new Date(`2000-01-01T${customStartTime}:00`)
    const endTime = new Date(startTime.getTime() + (minutes * 60 * 1000))
    const maxEndTime = new Date(`2000-01-01T${currentSlot.endTime}:00`)
    
    if (endTime <= maxEndTime) {
      setCustomEndTime(endTime.toTimeString().slice(0, 5))
    }
  }

  const handleRemoveSlot = (slotId: string) => {
    setSelectedSlots(prev => prev.filter(s => s.id !== slotId))
  }



  const handleProceedToCheckout = () => {
    if (selectedSlots.length === 0) return

    // Store selected slots in sessionStorage for the checkout page
    sessionStorage.setItem('selectedSlots', JSON.stringify(selectedSlots))
    sessionStorage.setItem('teacherInfo', JSON.stringify({
      id: teacher.id,
      name: teacher.name,
      subdomain: teacher.subdomain,
      hourlyRate: teacher.hourlyRate,
      title: teacher.title
    }))

    router.push(`/${teacher.subdomain}/checkout`)
  }

  const isSlotSelected = (slotId: string) => {
    return selectedSlots.some(slot => slot.id === slotId)
  }

  const getTotalHours = () => {
    return selectedSlots.reduce((total, slot) => {
      const startTime = slot.customStartTime || slot.startTime
      const endTime = slot.customEndTime || slot.endTime
      const start = new Date(`2000-01-01T${startTime}:00`)
      const end = new Date(`2000-01-01T${endTime}:00`)
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      return total + hours
    }, 0)
  }

  const getTotalCost = () => {
    if (!teacher.hourlyRate) return 0
    return getTotalHours() * teacher.hourlyRate
  }

  return (
    <>
      {/* Enhanced Time Selector Modal */}
      {showTimeSelector && currentSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            style={{ 
              backgroundColor: colorScheme.styles.background,
              borderColor: colorScheme.styles.border,
              border: `2px solid ${colorScheme.styles.border}`
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 
                className="text-lg sm:text-xl font-semibold"
                style={{ color: colorScheme.styles.textPrimary }}
              >
                Customize Your Session
              </h3>
              <button
                onClick={() => setShowTimeSelector(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: colorScheme.styles.textSecondary }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div 
              className="rounded-lg p-3 mb-4"
              style={{ backgroundColor: colorScheme.styles.primaryLight }}
            >
              <p 
                className="text-sm font-medium mb-1"
                style={{ color: colorScheme.styles.textPrimary }}
              >
                {selectedDate?.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <p 
                className="text-xs"
                style={{ color: colorScheme.styles.textSecondary }}
              >
                Available window: {currentSlot.startTime} - {currentSlot.endTime}
                {currentSlot.title && ` • ${currentSlot.title}`}
              </p>
            </div>

            {/* Quick Duration Selection */}
            <div className="mb-4">
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: colorScheme.styles.textPrimary }}
              >
                Quick Duration
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[30, 60, 90, 120].map(minutes => (
                  <button
                    key={minutes}
                    onClick={() => handleQuickTimeSelect(minutes)}
                    className="px-3 py-2 text-xs rounded-lg border transition-colors"
                    style={{ 
                      borderColor: colorScheme.styles.border,
                      backgroundColor: colorScheme.styles.backgroundSecondary,
                      color: colorScheme.styles.textPrimary
                    }}
                  >
                    {minutes < 60 ? `${minutes}m` : `${minutes/60}h`}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: colorScheme.styles.textPrimary }}
                >
                  Start Time
                </label>
                <select
                  value={customStartTime}
                  onChange={(e) => setCustomStartTime(e.target.value)}
                  className="w-full p-3 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                  style={{ 
                    borderColor: colorScheme.styles.border,
                    backgroundColor: colorScheme.styles.background
                  }}
                >
                  {generateTimeOptions(currentSlot.startTime, currentSlot.endTime, 15).slice(0, -1).map(time => (
                    <option key={time} value={time}>
                      {new Date(`2000-01-01T${time}:00`).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: colorScheme.styles.textPrimary }}
                >
                  End Time
                </label>
                <select
                  value={customEndTime}
                  onChange={(e) => setCustomEndTime(e.target.value)}
                  className="w-full p-3 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                  style={{ 
                    borderColor: colorScheme.styles.border,
                    backgroundColor: colorScheme.styles.background
                  }}
                >
                  {generateTimeOptions(currentSlot.startTime, currentSlot.endTime, 15)
                    .filter(time => time > customStartTime)
                    .map(time => (
                    <option key={time} value={time}>
                      {new Date(`2000-01-01T${time}:00`).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Session Summary */}
            <div 
              className="rounded-lg p-3 mb-4"
              style={{ backgroundColor: colorScheme.styles.backgroundSecondary }}
            >
              <div className="flex justify-between items-center text-sm">
                <span style={{ color: colorScheme.styles.textSecondary }}>Duration:</span>
                <span 
                  className="font-medium"
                  style={{ color: colorScheme.styles.textPrimary }}
                >
                  {calculateDuration(customStartTime, customEndTime).toFixed(1)} hours
                </span>
              </div>
              {teacher.hourlyRate && (
                <div className="flex justify-between items-center text-sm mt-1">
                  <span style={{ color: colorScheme.styles.textSecondary }}>Cost:</span>
                  <span 
                    className="font-medium"
                    style={{ color: colorScheme.styles.primary }}
                  >
                    ${(calculateDuration(customStartTime, customEndTime) * teacher.hourlyRate).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowTimeSelector(false)}
                className="px-4 py-3 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
                style={{ 
                  borderColor: colorScheme.styles.border,
                  color: colorScheme.styles.textSecondary
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleTimeSelection}
                className="flex-1 px-4 py-3 text-sm rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: colorScheme.styles.primary }}
              >
                Add to Booking ({calculateDuration(customStartTime, customEndTime).toFixed(1)}h)
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4 sm:space-y-6">
      {/* Enhanced Header with Controls */}
      <div 
        className="rounded-lg p-4 border"
        style={{ 
          backgroundColor: colorScheme.styles.background,
          borderColor: colorScheme.styles.border
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h4 
              className="text-lg font-semibold mb-1"
              style={{ color: colorScheme.styles.textPrimary }}
            >
              Schedule Your Session
            </h4>
            <p 
              className="text-sm"
              style={{ color: colorScheme.styles.textSecondary }}
            >
              Select dates and customize your booking times • {userTimeZone}
            </p>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-4">
            <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: colorScheme.styles.border }}>
              {(['month', 'week', 'list'] as ViewMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className="px-3 py-2 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: viewMode === mode ? colorScheme.styles.primary : colorScheme.styles.background,
                    color: viewMode === mode ? 'white' : colorScheme.styles.textSecondary
                  }}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t" style={{ borderColor: colorScheme.styles.border }}>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: colorScheme.styles.textPrimary }}>
              Default Duration
            </label>
            <select
              value={timeSlotDuration}
              onChange={(e) => setTimeSlotDuration(Number(e.target.value))}
              className="w-full p-2 text-xs border rounded-md"
              style={{ borderColor: colorScheme.styles.border }}
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: colorScheme.styles.textPrimary }}>
              Show Only
            </label>
            <select
              value={showAvailabilityOnly ? 'available' : 'all'}
              onChange={(e) => setShowAvailabilityOnly(e.target.value === 'available')}
              className="w-full p-2 text-xs border rounded-md"
              style={{ borderColor: colorScheme.styles.border }}
            >
              <option value="available">Available dates</option>
              <option value="all">All dates</option>
            </select>
          </div>

          <div className="lg:col-span-2 flex items-end">
            <button
              onClick={() => setShowBookingDetails(!showBookingDetails)}
              className="px-3 py-2 text-xs border rounded-md transition-colors"
              style={{ 
                borderColor: colorScheme.styles.border,
                backgroundColor: showBookingDetails ? colorScheme.styles.primaryLight : colorScheme.styles.background,
                color: colorScheme.styles.textPrimary
              }}
            >
              {showBookingDetails ? 'Hide' : 'Show'} Booking Stats
            </button>
          </div>
        </div>

        {/* Booking Statistics */}
        {showBookingDetails && (
          <div className="mt-4 pt-4 border-t grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ borderColor: colorScheme.styles.border }}>
            <div className="text-center">
              <div className="text-lg font-bold" style={{ color: colorScheme.styles.primary }}>
                {upcomingDates.length}
              </div>
              <div className="text-xs" style={{ color: colorScheme.styles.textSecondary }}>
                Available days
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold" style={{ color: colorScheme.styles.primary }}>
                {availabilitySlots.length}
              </div>
              <div className="text-xs" style={{ color: colorScheme.styles.textSecondary }}>
                Time slots
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold" style={{ color: colorScheme.styles.primary }}>
                {selectedSlots.length}
              </div>
              <div className="text-xs" style={{ color: colorScheme.styles.textSecondary }}>
                Selected
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold" style={{ color: colorScheme.styles.primary }}>
                {getTotalHours().toFixed(1)}h
              </div>
              <div className="text-xs" style={{ color: colorScheme.styles.textSecondary }}>
                Total hours
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Calendar Navigation */}
      {viewMode === 'month' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                className="p-2 rounded-lg border transition-all duration-200 hover:shadow-md"
                style={{ 
                  borderColor: colorScheme.styles.border,
                  color: colorScheme.styles.textPrimary,
                  backgroundColor: colorScheme.styles.background
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <h3 
                className="text-xl font-semibold"
                style={{ color: colorScheme.styles.textPrimary }}
              >
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                className="p-2 rounded-lg border transition-all duration-200 hover:shadow-md"
                style={{ 
                  borderColor: colorScheme.styles.border,
                  color: colorScheme.styles.textPrimary,
                  backgroundColor: colorScheme.styles.background
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-2 text-sm font-medium rounded-lg transition-colors"
              style={{ 
                backgroundColor: colorScheme.styles.primaryLight,
                color: colorScheme.styles.primary
              }}
            >
              Today
            </button>
          </div>
        </div>
      )}

      {/* Calendar Views */}
      {viewMode === 'month' && (
        <div className="mb-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
              <div 
                key={day}
                className="text-center font-semibold py-3 rounded-lg"
                style={{ 
                  color: colorScheme.styles.textPrimary,
                  backgroundColor: colorScheme.styles.backgroundSecondary
                }}
              >
                <div className="text-sm">{day.slice(0, 3)}</div>
                <div className="text-xs opacity-60">{day.slice(3)}</div>
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <button
                key={day.date.toISOString()}
                onClick={() => {
                  if (day.isCurrentMonth && day.hasAvailability && !day.isPast) {
                    setSelectedDate(day.date)
                  }
                }}
                disabled={!day.isCurrentMonth || !day.hasAvailability || day.isPast}
                className="aspect-square p-2 rounded-lg transition-all duration-200 relative min-h-16 flex flex-col items-center justify-center group"
                style={{ 
                  backgroundColor: day.isSelected 
                    ? colorScheme.styles.primary
                    : day.isToday
                    ? colorScheme.styles.accent + '20'
                    : day.hasAvailability && !day.isPast && day.isCurrentMonth
                    ? colorScheme.styles.backgroundSecondary
                    : 'transparent',
                  color: day.isSelected
                    ? 'white'
                    : day.isToday
                    ? colorScheme.styles.primary
                    : !day.isCurrentMonth || day.isPast
                    ? colorScheme.styles.textSecondary + '40'
                    : colorScheme.styles.textPrimary,
                  cursor: day.isCurrentMonth && day.hasAvailability && !day.isPast ? 'pointer' : 'default',
                  border: `2px solid ${
                    day.isSelected 
                      ? colorScheme.styles.primary 
                      : day.isToday 
                      ? colorScheme.styles.accent 
                      : 'transparent'
                  }`
                }}
              >
                <div className="text-sm font-medium">{day.date.getDate()}</div>
                {day.hasAvailability && !day.isPast && day.isCurrentMonth && (
                  <div className="flex items-center gap-1 mt-1">
                    <div 
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: day.isSelected ? 'white' : colorScheme.styles.primary }}
                    />
                    <span className="text-xs opacity-70">
                      {day.availableSlots.length}
                    </span>
                  </div>
                )}
                {day.isToday && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full" 
                       style={{ backgroundColor: colorScheme.styles.accent }}>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-4" style={{ color: colorScheme.styles.textPrimary }}>
            Next 30 Days
          </h4>
          <div className="space-y-3">
            {upcomingDates.slice(0, 10).map(({ date, slots }) => (
              <div
                key={date.toISOString()}
                className="p-4 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer"
                style={{ 
                  backgroundColor: selectedDate?.toDateString() === date.toDateString() 
                    ? colorScheme.styles.primaryLight 
                    : colorScheme.styles.background,
                  borderColor: colorScheme.styles.border
                }}
                onClick={() => setSelectedDate(date)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium" style={{ color: colorScheme.styles.textPrimary }}>
                      {date.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="text-sm" style={{ color: colorScheme.styles.textSecondary }}>
                      {slots.length} available time{slots.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {slots.slice(0, 3).map(slot => (
                      <span
                        key={slot.id}
                        className="px-2 py-1 text-xs rounded-md"
                        style={{ 
                          backgroundColor: colorScheme.styles.primaryLight,
                          color: colorScheme.styles.primary
                        }}
                      >
                        {slot.startTime}-{slot.endTime}
                      </span>
                    ))}
                    {slots.length > 3 && (
                      <span className="text-xs" style={{ color: colorScheme.styles.textSecondary }}>
                        +{slots.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Times for Selected Date */}
      {selectedDate && (
        <div 
          className="rounded-lg sm:rounded-xl p-3 sm:p-4 border mb-4 sm:mb-6"
          style={{ 
            background: `linear-gradient(135deg, ${colorScheme.styles.backgroundSecondary}, ${colorScheme.styles.primaryLight})`,
            borderColor: colorScheme.styles.border
          }}
        >
          <h4 
            className="text-sm sm:text-base font-semibold mb-2 sm:mb-3"
            style={{ color: colorScheme.styles.textPrimary }}
          >
            Available Times - {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'short', 
              day: 'numeric' 
            })}
          </h4>
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {getAvailableSlotsForDate(selectedDate).map(slot => {
              const selectedSlot = selectedSlots.find(s => 
                s.id === slot.id && 
                s.date?.toDateString() === selectedDate?.toDateString()
              )
              const isSelected = !!selectedSlot
              
              return (
                <div key={slot.id} className="relative">
                  <button
                    onClick={() => handleSlotClick(slot, selectedDate)}
                    className="w-full rounded-lg px-4 py-3 text-sm transition-all duration-200 border hover:shadow-md group"
                    style={{ 
                      backgroundColor: isSelected 
                        ? colorScheme.styles.primary 
                        : colorScheme.styles.background,
                      borderColor: isSelected 
                        ? colorScheme.styles.primary 
                        : colorScheme.styles.border,
                      color: isSelected 
                        ? 'white' 
                        : colorScheme.styles.textPrimary
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <div className="font-semibold">
                          {new Date(`2000-01-01T${slot.startTime}:00`).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit', 
                            hour12: true 
                          })} - {new Date(`2000-01-01T${slot.endTime}:00`).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit', 
                            hour12: true 
                          })}
                        </div>
                        {slot.title && (
                          <div className="text-xs mt-1 opacity-80">
                            {slot.title}
                          </div>
                        )}
                        {isSelected && selectedSlot && (
                          <div className="text-xs mt-1 opacity-90 font-medium">
                            Selected: {selectedSlot.customStartTime} - {selectedSlot.customEndTime} 
                            ({selectedSlot.duration?.toFixed(1)}h)
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {teacher.hourlyRate && (
                          <div className="text-xs opacity-80">
                            ${teacher.hourlyRate}/hr
                          </div>
                        )}
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected ? 'border-white bg-white' : 'border-current'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3" style={{ color: colorScheme.styles.primary }} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Enhanced Selected Slots Summary & Checkout */}
      {selectedSlots.length > 0 && (
        <div 
          className="rounded-xl p-6 border-2 shadow-lg transition-all duration-300"
          style={{ 
            backgroundColor: colorScheme.styles.background,
            borderColor: colorScheme.styles.primary
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 
              className="text-lg font-semibold flex items-center gap-2"
              style={{ color: colorScheme.styles.textPrimary }}
            >
              <svg className="w-5 h-5" style={{ color: colorScheme.styles.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Your Booking Summary
            </h3>
            <span 
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{ 
                backgroundColor: colorScheme.styles.primaryLight,
                color: colorScheme.styles.primary
              }}
            >
              {selectedSlots.length} session{selectedSlots.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="space-y-3 mb-4">
            {selectedSlots.map((slot, index) => (
              <div 
                key={`${slot.id}-${slot.date?.getTime()}`}
                className="flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:shadow-sm"
                style={{ backgroundColor: colorScheme.styles.backgroundSecondary }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{ backgroundColor: colorScheme.styles.primary }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div 
                        className="font-medium"
                        style={{ color: colorScheme.styles.textPrimary }}
                      >
                        {slot.date?.toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div 
                        className="text-sm"
                        style={{ color: colorScheme.styles.textSecondary }}
                      >
                        {new Date(`2000-01-01T${slot.customStartTime || slot.startTime}:00`).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit', 
                          hour12: true 
                        })} - {new Date(`2000-01-01T${slot.customEndTime || slot.endTime}:00`).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit', 
                          hour12: true 
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div 
                      className="text-sm font-medium"
                      style={{ color: colorScheme.styles.textPrimary }}
                    >
                      {slot.duration?.toFixed(1)}h
                    </div>
                    {teacher.hourlyRate && (
                      <div 
                        className="text-xs"
                        style={{ color: colorScheme.styles.textSecondary }}
                      >
                        ${(slot.duration! * teacher.hourlyRate).toFixed(2)}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveSlot(slot.id)}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                    title="Remove session"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {teacher.hourlyRate && (
            <div 
              className="border-t pt-3 sm:pt-4 mb-3 sm:mb-4 transition-colors duration-300"
              style={{ borderColor: colorScheme.styles.border }}
            >
              <div className="flex justify-between items-center mb-2 text-sm">
                <span 
                  className="transition-colors duration-300"
                  style={{ color: colorScheme.styles.textSecondary }}
                >
                  Total Hours: {getTotalHours()}
                </span>
                <span 
                  className="transition-colors duration-300"
                  style={{ color: colorScheme.styles.textSecondary }}
                >
                  Rate: ${teacher.hourlyRate}/hr
                </span>
              </div>
              <div className="flex justify-between items-center text-lg sm:text-xl font-bold">
                <span 
                  className="transition-colors duration-300"
                  style={{ color: colorScheme.styles.textPrimary }}
                >
                  Total Cost:
                </span>
                <span 
                  className="transition-colors duration-300"
                  style={{ color: colorScheme.styles.primary }}
                >
                  ${getTotalCost().toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleProceedToCheckout}
            className="w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-semibold text-sm sm:text-lg transition-all duration-200 hover:shadow-lg"
            style={{ 
              backgroundColor: colorScheme.styles.primary,
              color: 'white'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Proceed to Checkout ({selectedSlots.length} slot{selectedSlots.length !== 1 ? 's' : ''})
          </button>
        </div>
      )}
      </div>
    </>
  )
}
