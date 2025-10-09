'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AvailabilitySlot {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
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
  const router = useRouter()

  // Generate 30-minute time intervals between start and end time
  const generateTimeOptions = (startTime: string, endTime: string) => {
    const options = []
    const start = new Date(`2000-01-01T${startTime}:00`)
    const end = new Date(`2000-01-01T${endTime}:00`)
    
    let current = new Date(start)
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

  const handleSlotClickOld = (slot: AvailabilitySlot) => {
    const dayName = daysOfWeek.find(day => day.id === slot.dayOfWeek)?.name || ''
    const selectedSlot: SelectedSlot = {
      ...slot,
      dayName
    }

    setSelectedSlots(prev => {
      const isAlreadySelected = prev.some(s => s.id === slot.id)
      if (isAlreadySelected) {
        return prev.filter(s => s.id !== slot.id)
      } else {
        return [...prev, selectedSlot]
      }
    })
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            className="bg-white rounded-2xl p-6 max-w-md w-full mx-4"
            style={{ 
              backgroundColor: colorScheme.styles.background,
              borderColor: colorScheme.styles.border,
              border: `2px solid ${colorScheme.styles.border}`
            }}
          >
            <h3 
              className="text-xl font-semibold mb-4"
              style={{ color: colorScheme.styles.textPrimary }}
            >
              Select Your Time
            </h3>
            <p 
              className="text-sm mb-4"
              style={{ color: colorScheme.styles.textSecondary }}
            >
              Choose your preferred start and end time within the available window for {daysOfWeek.find(d => d.id === currentSlot.dayOfWeek)?.name}
            </p>
            <p 
              className="text-sm mb-6 font-medium"
              style={{ color: colorScheme.styles.primary }}
            >
              Available: {currentSlot.startTime} - {currentSlot.endTime}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
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
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:border-transparent"
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
                  className="block text-sm font-medium mb-2"
                  style={{ color: colorScheme.styles.textPrimary }}
                >
                  End Time
                </label>
                <select
                  value={customEndTime}
                  onChange={(e) => setCustomEndTime(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:border-transparent"
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

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowTimeSelector(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                style={{ 
                  borderColor: colorScheme.styles.border,
                  color: colorScheme.styles.textSecondary
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleTimeSelection}
                className="px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: colorScheme.styles.primary }}
              >
                Select Time
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
      {/* Instructions */}
      <div 
        className="rounded-lg p-4 border transition-colors duration-300"
        style={{ 
          backgroundColor: colorScheme.styles.primaryLight,
          borderColor: colorScheme.styles.border
        }}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg 
              className="w-5 h-5 mt-0.5 transition-colors duration-300" 
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
              className="font-medium mb-1 transition-colors duration-300"
              style={{ color: colorScheme.styles.textPrimary }}
            >
              Select Time Slots
            </h4>
            <p 
              className="text-sm transition-colors duration-300"
              style={{ color: colorScheme.styles.textSecondary }}
            >
              Click on available time windows to customize your booking times. You can select specific hours within each window.
            </p>
          </div>
        </div>
      </div>

      {/* Week View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {daysOfWeek.map(day => {
          const dayWindows = availabilitySlots.filter(slot => slot.dayOfWeek === day.id)
          
          return (
            <div 
              key={day.id} 
              className="rounded-xl p-4 border transition-colors duration-300"
              style={{ 
                background: `linear-gradient(135deg, ${colorScheme.styles.backgroundSecondary}, ${colorScheme.styles.primaryLight})`,
                borderColor: colorScheme.styles.border
              }}
            >
              <h3 
                className="font-semibold mb-3 text-center transition-colors duration-300"
                style={{ color: colorScheme.styles.textPrimary }}
              >
                {day.name}
              </h3>
              {dayWindows.length > 0 ? (
                <div className="space-y-2">
                  {dayWindows.map(window => {
                    const selected = isSlotSelected(window.id)
                    return (
                      <button
                        key={window.id}
                        onClick={() => handleSlotClick(window)}
                        className="w-full rounded-lg px-3 py-3 text-sm transition-all duration-200 group border"
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
                        <div className="text-center">
                          <div className="font-medium transition-colors duration-200">
                            {window.startTime} - {window.endTime}
                          </div>
                          {selected ? (
                            <div className="text-xs mt-1 opacity-90">
                              ✓ Customized
                            </div>
                          ) : (
                            <div className="text-xs mt-1 opacity-70">
                              Click to customize
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div 
                    className="mb-2 transition-colors duration-300"
                    style={{ color: colorScheme.styles.textSecondary }}
                  >
                    <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p 
                    className="text-xs transition-colors duration-300"
                    style={{ color: colorScheme.styles.textSecondary }}
                  >
                    Not available
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Selected Slots Summary & Checkout */}
      {selectedSlots.length > 0 && (
        <div 
          className="rounded-xl p-6 border-2 transition-colors duration-300"
          style={{ 
            backgroundColor: colorScheme.styles.background,
            borderColor: colorScheme.styles.primary
          }}
        >
          <h3 
            className="text-lg font-semibold mb-4 transition-colors duration-300"
            style={{ color: colorScheme.styles.textPrimary }}
          >
            Selected Time Slots
          </h3>
          
          <div className="space-y-2 mb-4">
            {selectedSlots.map(slot => (
              <div 
                key={slot.id}
                className="flex justify-between items-center py-2 px-3 rounded-lg transition-colors duration-300"
                style={{ backgroundColor: colorScheme.styles.primaryLight }}
              >
                <div className="flex flex-col">
                  <span 
                    className="font-medium transition-colors duration-300"
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
              className="border-t pt-4 mb-4 transition-colors duration-300"
              style={{ borderColor: colorScheme.styles.border }}
            >
              <div className="flex justify-between items-center mb-2">
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
                  Rate: ${teacher.hourlyRate}/hour
                </span>
              </div>
              <div className="flex justify-between items-center text-xl font-bold">
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
            className="w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 hover:shadow-lg"
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
