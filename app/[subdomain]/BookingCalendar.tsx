'use client'

import { useState, useMemo, useEffect } from 'react'
import React from 'react';

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
  title?: string | null
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
  onDaySelect?: (date: Date) => void
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({ teacher, availabilitySlots, colorScheme, onDaySelect }) => {

  // All hooks and logic above
  // ...existing code...

  const [currentMonth] = useState(new Date());
  const calendarDays: CalendarDay[] = useMemo(() => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const isCurrentMonth = currentDate.getMonth() === currentMonth.getMonth();
      const isPast = currentDate < today;
      const isToday = currentDate.toDateString() === today.toDateString();
      const availableSlots = availabilitySlots.filter(slot => {
        const slotStart = new Date(slot.startDate);
        const slotEnd = slot.endDate ? new Date(slot.endDate) : null;
        const isAfterStart = currentDate >= slotStart;
        const isBeforeEnd = !slotEnd || currentDate <= slotEnd;
        return slot.dayOfWeek === currentDate.getDay() && slot.isActive && isAfterStart && isBeforeEnd;
      });
      const hasAvailability = availableSlots.length > 0;
      days.push({
        date: currentDate,
        isCurrentMonth,
        isPast,
        availableSlots,
        hasAvailability,
        isToday
      });
    }
    return days;
  }, [currentMonth, availabilitySlots]);

  // JSX below
  return (
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
        {calendarDays.map((day: CalendarDay) => (
          <div
            key={day.date.toISOString()}
            className="aspect-square p-2 rounded-lg transition-all duration-200 relative min-h-16 flex flex-col items-center justify-center group cursor-pointer"
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
            onClick={() => day.hasAvailability && !day.isPast && day.isCurrentMonth && onDaySelect && onDaySelect(day.date)}
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
  );
};

export default BookingCalendar;