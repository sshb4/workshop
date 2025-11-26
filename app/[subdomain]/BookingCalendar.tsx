'use client'

import { useState, useMemo } from 'react'
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
  isBlocked: boolean
}

interface BlockedDate {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  isRecurring: boolean;
  recurringType?: 'weekly' | 'monthly';
}

interface BookingCalendarProps {
  teacher: Teacher;
  availabilitySlots: AvailabilitySlot[];
  blockedDates: BlockedDate[];
  colorScheme: ColorScheme;
  onDaySelect?: (date: Date) => void;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({ availabilitySlots, blockedDates, colorScheme, onDaySelect }) => {

  // All hooks and logic above
  const [currentMonth] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const calendarDays: CalendarDay[] = useMemo(() => {
  const firstDay = new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth(), 1));
  const startDate = new Date(firstDay);
  startDate.setUTCDate(firstDay.getUTCDate() - firstDay.getUTCDay());
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setUTCDate(startDate.getUTCDate() + i);
  const isCurrentMonth = currentDate.getUTCMonth() === currentMonth.getUTCMonth();
  const isPast = currentDate.getTime() < Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const isToday = currentDate.getUTCFullYear() === today.getUTCFullYear() && currentDate.getUTCMonth() === today.getUTCMonth() && currentDate.getUTCDate() === today.getUTCDate();
      const availableSlots = availabilitySlots.filter(slot => {
        // Compare only the date part to avoid timezone issues
        const slotStartDateStr = new Date(slot.startDate).toISOString().slice(0, 10);
        const slotEndDateStr = slot.endDate ? new Date(slot.endDate).toISOString().slice(0, 10) : slotStartDateStr;
        const currentDateStr = currentDate.toISOString().slice(0, 10);
        const isAfterStart = currentDateStr >= slotStartDateStr;
        const isBeforeEnd = !slot.endDate || currentDateStr <= slotEndDateStr;
        const match = slot.dayOfWeek === currentDate.getUTCDay() && slot.isActive && isAfterStart && isBeforeEnd;
        console.log('Calendar debug:', {
          slotId: slot.id,
          slotDayOfWeek: slot.dayOfWeek,
          slotStartDate: slot.startDate,
          slotEndDate: slot.endDate,
          currentDate: currentDateStr,
          currentDayOfWeek: currentDate.getUTCDay(),
          match
        });
        return match;
      });
      const hasAvailability = availableSlots.length > 0;
      // Blocked logic
      const isBlocked = blockedDates && blockedDates.some(blocked => {
        const start = new Date(blocked.startDate);
        const end = blocked.endDate ? new Date(blocked.endDate) : start;
        // Recurring weekly
        if (blocked.isRecurring && blocked.recurringType === 'weekly') {
          return currentDate.getDay() === start.getDay();
        }
        // Otherwise block date range
        return currentDate >= start && currentDate <= end;
      });
      days.push({
        date: currentDate,
        isCurrentMonth,
        isPast,
        availableSlots,
        hasAvailability,
        isToday,
        isBlocked // add to CalendarDay if you want
      });
    }
    return days;
  }, [currentMonth, availabilitySlots, blockedDates]);

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
        {calendarDays.map((day: CalendarDay) => {
          // Find the first available slot for this day
          const slot = day.availableSlots[0];
          const isSelected = selectedSlot && slot && selectedSlot.id === slot.id;
          return (
            <div
              key={day.date.toISOString()}
              className={`aspect-square p-2 rounded-lg transition-all duration-200 relative min-h-16 flex flex-col items-center justify-center group cursor-pointer ${isSelected ? 'ring-2 ring-green-500' : ''}`}
              style={{ 
                backgroundColor: day.hasAvailability && !day.isPast && day.isCurrentMonth && !day.isBlocked
                  ? colorScheme.styles.backgroundSecondary
                  : day.isBlocked && !day.isPast && day.isCurrentMonth
                  ? '#ffeaea' // light red for blocked
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
              onClick={() => {
                if (day.hasAvailability && !day.isPast && day.isCurrentMonth && !day.isBlocked && slot) {
                  setSelectedSlot(slot);
                }
              }}
            >
              <div className="absolute top-1 left-1 text-xs font-bold opacity-80">
                {day.date.getDate()}
              </div>
              {day.hasAvailability && !day.isPast && day.isCurrentMonth && !day.isBlocked && (
                <div className="flex flex-col items-center justify-center mt-4 w-full">
                  <span className="text-xs font-medium text-green-600">Available</span>
                </div>
              )}
              {day.isBlocked && !day.isPast && day.isCurrentMonth && (
                <div className="flex flex-col items-center justify-center mt-4 w-full">
                  <span className="text-xs font-medium text-red-500">Blocked</span>
                </div>
              )}
              {!day.hasAvailability && !day.isBlocked && !day.isPast && day.isCurrentMonth && (
                <div className="flex flex-col items-center justify-center mt-4 w-full">
                  <span className="text-xs font-medium text-gray-400">Unavailable</span>
                </div>
              )}
              {day.isToday && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full" 
                     style={{ backgroundColor: colorScheme.styles.accent }}>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Checkout Button */}
      {selectedSlot && (
        <div className="flex justify-center mt-6">
          <a
            href={`./checkout?slotId=${selectedSlot.id}`}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 transition-colors"
          >
            Proceed to Checkout
          </a>
        </div>
      )}
    </div>
  );
};

export default BookingCalendar;