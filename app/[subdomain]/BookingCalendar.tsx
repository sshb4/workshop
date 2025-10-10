'use client'

import { useState } from 'react'
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
}

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
  const router = useRouter()

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

  // Generate 30-minute time intervals between start and end time
  const generateTimeOptions = (startTime: string, endTime: string) => {
    const options = []
    const start = new Date(`2000-01-01T${startTime}:00`)
    const end = new Date(`2000-01-01T${endTime}:00`)
    
    const current = new Date(start)
    while (current < end) {
      options.push(current.toTimeString().slice(0, 5))
      current.setMinutes(current.getMinutes() + 30)
    }
    options.push(endTime) // Add the end time as final option
    
    return options
  }

  const handleSlotClick = (slot: AvailabilitySlot) => {
    setCurrentSlot(slot)
    setCustomStartTime(slot.startTime)
    setCustomEndTime(slot.endTime)
    setShowTimeSelector(true)
  }

  const handleTimeSelection = () => {
    if (!currentSlot) return
    
    const dayName = daysOfWeek.find(day => day.id === currentSlot.dayOfWeek)?.name || ''
    const selectedSlot: SelectedSlot = {
      ...currentSlot,
      dayName,
      customStartTime,
      customEndTime
    }

    setSelectedSlots(prev => {
      const existingIndex = prev.findIndex(s => s.id === currentSlot.id)
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
      {/* Time Selector Modal */}
      {showTimeSelector && currentSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-md w-full"
            style={{ 
              backgroundColor: colorScheme.styles.background,
              borderColor: colorScheme.styles.border,
              border: `2px solid ${colorScheme.styles.border}`
            }}
          >
            <h3 
              className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4"
              style={{ color: colorScheme.styles.textPrimary }}
            >
              Select Your Time
            </h3>
            <p 
              className="text-xs sm:text-sm mb-3 sm:mb-4"
              style={{ color: colorScheme.styles.textSecondary }}
            >
              Choose your preferred start and end time within the available window for {daysOfWeek.find(d => d.id === currentSlot.dayOfWeek)?.name}
            </p>
            <p 
              className="text-xs sm:text-sm mb-4 sm:mb-6 font-medium"
              style={{ color: colorScheme.styles.primary }}
            >
              Available: {currentSlot.startTime} - {currentSlot.endTime}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div>
                <label 
                  className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2"
                  style={{ color: colorScheme.styles.textPrimary }}
                >
                  Start Time
                </label>
                <select
                  value={customStartTime}
                  onChange={(e) => setCustomStartTime(e.target.value)}
                  className="w-full p-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ 
                    borderColor: colorScheme.styles.border
                  }}
                >
                  {generateTimeOptions(currentSlot.startTime, currentSlot.endTime).slice(0, -1).map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              <div>
                <label 
                  className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2"
                  style={{ color: colorScheme.styles.textPrimary }}
                >
                  End Time
                </label>
                <select
                  value={customEndTime}
                  onChange={(e) => setCustomEndTime(e.target.value)}
                  className="w-full p-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ 
                    borderColor: colorScheme.styles.border
                  }}
                >
                  {generateTimeOptions(currentSlot.startTime, currentSlot.endTime).filter(time => time > customStartTime).map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
              <button
                onClick={() => setShowTimeSelector(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
                style={{ 
                  borderColor: colorScheme.styles.border,
                  color: colorScheme.styles.textSecondary
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleTimeSelection}
                className="px-4 py-2 text-sm rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: colorScheme.styles.primary }}
              >
                Select Time
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4 sm:space-y-6">
      {/* Instructions */}
      <div 
        className="rounded-lg p-3 sm:p-4 border transition-colors duration-300"
        style={{ 
          backgroundColor: colorScheme.styles.primaryLight,
          borderColor: colorScheme.styles.border
        }}
      >
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="flex-shrink-0">
            <svg 
              className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 transition-colors duration-300" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ color: colorScheme.styles.primary }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 
              className="text-sm sm:text-base font-medium mb-1 transition-colors duration-300"
              style={{ color: colorScheme.styles.textPrimary }}
            >
              Select Time Slots
            </h4>
            <p 
              className="text-xs sm:text-sm transition-colors duration-300"
              style={{ color: colorScheme.styles.textSecondary }}
            >
              Click on available time windows to customize your booking times. You can select specific hours within each window.
            </p>
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
          className="p-1.5 sm:p-2 rounded-lg border transition-colors hover:bg-opacity-50"
          style={{ 
            borderColor: colorScheme.styles.border,
            color: colorScheme.styles.textPrimary
          }}
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h3 
          className="text-lg sm:text-xl font-semibold px-2"
          style={{ color: colorScheme.styles.textPrimary }}
        >
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
          className="p-1.5 sm:p-2 rounded-lg border transition-colors hover:bg-opacity-50"
          style={{ 
            borderColor: colorScheme.styles.border,
            color: colorScheme.styles.textPrimary
          }}
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="mb-4 sm:mb-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div 
              key={day}
              className="text-center text-xs sm:text-sm font-medium py-1 sm:py-2"
              style={{ color: colorScheme.styles.textSecondary }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {(() => {
            const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
            const startDate = new Date(firstDay)
            startDate.setDate(startDate.getDate() - firstDay.getDay())
            
            const days = []
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            
            for (let i = 0; i < 42; i++) {
              const currentDate = new Date(startDate)
              currentDate.setDate(startDate.getDate() + i)
              
              const isCurrentMonth = currentDate.getMonth() === currentMonth.getMonth()
              const isPast = currentDate < today
              const availableSlots = isCurrentMonth ? getAvailableSlotsForDate(currentDate) : []
              const hasAvailability = availableSlots.length > 0
              const isSelected = selectedDate?.toDateString() === currentDate.toDateString()
              
              days.push(
                <button
                  key={currentDate.toISOString()}
                  onClick={() => {
                    if (isCurrentMonth && hasAvailability && !isPast) {
                      setSelectedDate(currentDate)
                    }
                  }}
                  disabled={!isCurrentMonth || !hasAvailability || isPast}
                  className="aspect-square p-0.5 sm:p-1 text-xs sm:text-sm rounded-md sm:rounded-lg transition-all duration-200 relative"
                  style={{ 
                    backgroundColor: isSelected 
                      ? colorScheme.styles.primary
                      : hasAvailability && !isPast && isCurrentMonth
                      ? colorScheme.styles.backgroundSecondary
                      : 'transparent',
                    color: isSelected
                      ? 'white'
                      : !isCurrentMonth || isPast
                      ? colorScheme.styles.textSecondary + '60'
                      : colorScheme.styles.textPrimary,
                    cursor: isCurrentMonth && hasAvailability && !isPast ? 'pointer' : 'default',
                    border: `1px solid ${isSelected ? colorScheme.styles.primary : 'transparent'}`
                  }}
                >
                  <div>{currentDate.getDate()}</div>
                  {hasAvailability && !isPast && isCurrentMonth && (
                    <div 
                      className="w-1 h-1 rounded-full absolute bottom-0.5 sm:bottom-1 left-1/2 transform -translate-x-1/2"
                      style={{ backgroundColor: isSelected ? 'white' : colorScheme.styles.primary }}
                    />
                  )}
                </button>
              )
            }
            
            return days
          })()}
        </div>
      </div>

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
              const selected = isSlotSelected(slot.id)
              return (
                <button
                  key={slot.id}
                  onClick={() => handleSlotClick(slot)}
                  className="rounded-md sm:rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm transition-all duration-200 border"
                  style={{ 
                    backgroundColor: selected 
                      ? colorScheme.styles.primary 
                      : colorScheme.styles.background,
                    borderColor: selected 
                      ? colorScheme.styles.primary 
                      : colorScheme.styles.border,
                    color: selected 
                      ? 'white' 
                      : colorScheme.styles.textPrimary
                  }}
                >
                  <div className="font-medium">
                    {slot.startTime} - {slot.endTime}
                  </div>
                  {slot.title && (
                    <div className="text-xs mt-1 opacity-70">
                      {slot.title}
                    </div>
                  )}
                  {selected && (
                    <div className="text-xs mt-1 opacity-90">
                      ✓ Selected
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Selected Slots Summary & Checkout */}
      {selectedSlots.length > 0 && (
        <div 
          className="rounded-lg sm:rounded-xl p-4 sm:p-6 border-2 transition-colors duration-300"
          style={{ 
            backgroundColor: colorScheme.styles.background,
            borderColor: colorScheme.styles.primary
          }}
        >
          <h3 
            className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 transition-colors duration-300"
            style={{ color: colorScheme.styles.textPrimary }}
          >
            Selected Time Slots
          </h3>
          
          <div className="space-y-2 mb-3 sm:mb-4">
            {selectedSlots.map(slot => (
              <div 
                key={slot.id}
                className="flex justify-between items-center py-2 px-2 sm:px-3 rounded-md sm:rounded-lg transition-colors duration-300"
                style={{ backgroundColor: colorScheme.styles.primaryLight }}
              >
                <div className="flex flex-col">
                  <span 
                    className="text-sm sm:text-base font-medium transition-colors duration-300"
                    style={{ color: colorScheme.styles.textPrimary }}
                  >
                    {slot.dayName}
                  </span>
                  <span 
                    className="text-xs transition-colors duration-300"
                    style={{ color: colorScheme.styles.textSecondary }}
                  >
                    {slot.customStartTime || slot.startTime} - {slot.customEndTime || slot.endTime}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveSlot(slot.id)}
                  className="text-red-500 hover:text-red-700 text-sm p-1"
                  title="Remove slot"
                >
                  ✕
                </button>
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
