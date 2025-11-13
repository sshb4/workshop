"use client";
import React, { useState, useMemo } from "react";

import type { ColorScheme } from '@/lib/themes';

interface BookingSettings {
  form_fields?: string | Record<string, boolean> | Array<CustomField>;
}

interface AvailabilitySlot {
  id: string;
  title: string | null;
  startDate: string;
  endDate: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface ManualBookModalProps {
  colorScheme: ColorScheme;
  bookingSettings: BookingSettings;
  availabilitySlots: AvailabilitySlot[];
  showCalendar: boolean;
  teacher: {
    id: string;
    name: string;
    subdomain: string;
    hourlyRate?: number;
    title?: string;
    email?: string;
    profileImage?: string;
    bio?: string;
    phone?: string;
    colorScheme?: string;
  };
}

interface CustomField {
  name: string;
  label?: string;
  type?: string;
  required?: boolean;
}

export default function ManualBookModal({ colorScheme, bookingSettings, availabilitySlots, showCalendar, teacher }: ManualBookModalProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: null, isAvailable: false, isPast: false });
    }

    // Add actual days of the month
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isPast = date < today;
      const dayOfWeek = date.getDay();
      
      // Get all availability slots for this date
      const availableSlots = availabilitySlots.filter(slot => {
        const slotStart = new Date(slot.startDate);
        const slotEnd = slot.endDate ? new Date(slot.endDate) : slotStart;
        
        // Check if date is within slot range and matches day of week
        return (
          slot.dayOfWeek === dayOfWeek &&
          date >= slotStart &&
          date <= slotEnd
        );
      });

      days.push({
        date,
        isAvailable: availableSlots.length > 0 && !isPast,
        isPast,
        timeSlots: availableSlots.map(slot => `${slot.startTime}-${slot.endTime}`)
      });
    }

    return days;
  }, [currentMonth, availabilitySlots]);

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  let customFields: CustomField[] = [];
  
  // Parse form_fields from booking settings
  if (bookingSettings?.form_fields) {
    let formFields: Record<string, boolean>;
    
    // If it's a string, try to parse it as JSON
    if (typeof bookingSettings.form_fields === 'string') {
      try {
        const parsed = JSON.parse(bookingSettings.form_fields);
        formFields = parsed as Record<string, boolean>;
      } catch {
        formFields = {};
      }
    } else if (Array.isArray(bookingSettings.form_fields)) {
      // Handle array format (legacy support)
      formFields = {};
      bookingSettings.form_fields.forEach((field: CustomField) => {
        if (field.name) {
          formFields[field.name] = true;
        }
      });
    } else {
      // Assume it's already a Record<string, boolean>
      formFields = bookingSettings.form_fields as Record<string, boolean>;
    }
    
    // Convert the formFields object to an array of CustomField objects
    const fieldDefinitions = [
      { name: 'name', label: 'Full Name', type: 'text', required: true },
      { name: 'email', label: 'Email Address', type: 'email', required: true },
      { name: 'phone', label: 'Phone Number', type: 'tel', required: true },
      { name: 'address', label: 'Address', type: 'text', required: true },
      { name: 'dates', label: 'Preferred Dates', type: 'text', required: true },
      { name: 'description', label: 'Description/Notes', type: 'textarea', required: true }
    ];
    
    customFields = fieldDefinitions.filter(field => formFields[field.name] === true);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle phone number formatting
    if (name === 'phone') {
      const cleaned = value.replace(/\D/g, '');
      let formatted = cleaned;
      
      if (cleaned.length >= 6) {
        formatted = `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6,10)}`;
      } else if (cleaned.length >= 3) {
        formatted = `(${cleaned.slice(0,3)}) ${cleaned.slice(3)}`;
      }
      
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Format the date range for submission
      const submissionData = { ...formData };
      
      // Combine start and end dates into a readable format
      if (formData.startDate) {
        const startDate = new Date(formData.startDate).toLocaleDateString();
        const endDate = formData.endDate ? new Date(formData.endDate).toLocaleDateString() : null;
        
        if (endDate && endDate !== startDate) {
          submissionData.dates = `${startDate} - ${endDate}`;
        } else {
          submissionData.dates = startDate;
        }
        
        // Remove the separate date fields from submission
        delete submissionData.startDate;
        delete submissionData.endDate;
      }

      const response = await fetch('/api/booking-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacherId: teacher.id,
          formData: submissionData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit booking request');
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSubmitSuccess(false);
        setFormData({});
      }, 3000);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setOpen(false);
    setFormData({});
    setSubmitError('');
    setSubmitSuccess(false);
  };
  return (
    <>
      {/* Calendar View - Always visible on page */}
      {availabilitySlots.length > 0 && (
        <div className="mb-8 rounded-xl shadow-sm border p-6 transition-colors duration-300"
          style={{
            backgroundColor: colorScheme.styles.background,
            borderColor: colorScheme.styles.border
          }}
        >
          <h4 className="text-xl font-semibold mb-6 text-gray-800">Available Dates</h4>
          
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              ← Previous
            </button>
            <h5 className="text-xl font-bold text-gray-800">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h5>
            <button
              type="button"
              onClick={goToNextMonth}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Next →
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-sm text-gray-600 py-2">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {calendarDays.map((day, idx) => (
              <div
                key={idx}
                className={`
                  min-h-[80px] flex flex-col items-center justify-start p-1 text-sm rounded-lg
                  ${!day.date ? 'invisible' : ''}
                  ${day.isPast ? 'text-gray-300 cursor-not-allowed bg-gray-50' : ''}
                  ${day.isAvailable && !day.isPast 
                    ? 'bg-green-50 text-green-800 border-2 border-green-500' 
                    : day.date && !day.isPast 
                    ? 'bg-gray-100 text-gray-500 border border-gray-200'
                    : ''
                  }
                `}
              >
                {day.date && (
                  <>
                    <div className="font-semibold mb-1">{day.date.getDate()}</div>
                    {day.isAvailable && !day.isPast && day.timeSlots && (
                      <div className="text-[10px] text-center space-y-0.5">
                        {day.timeSlots.map((time, i) => (
                          <div key={i} className="text-green-700 font-medium">
                            {time}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded"></div>
              <span className="text-gray-600">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 rounded"></div>
              <span className="text-gray-600">Not Available</span>
            </div>
          </div>
        </div>
      )}

      <p className="mb-6 sm:mb-8 text-sm sm:text-lg transition-colors duration-300" style={{ color: colorScheme.styles.textSecondary }}>
        Please fill out the form below to request a booking.
      </p>
      <button
        className="bg-primary text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-primaryHover transition-colors duration-200"
        style={{ backgroundColor: colorScheme.styles.primary, color: colorScheme.styles.textPrimary }}
        onClick={() => setOpen(true)}
      >
        Book Now
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-4xl w-full relative my-8 max-h-[90vh] overflow-y-auto">
            <button 
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl z-10" 
              onClick={closeModal}
              disabled={isSubmitting}
            >
              &times;
            </button>
            <h3 className="text-2xl font-bold mb-6" style={{ color: colorScheme.styles.primary }}>
              {submitSuccess ? 'Request Submitted!' : 'Booking Request'}
            </h3>
            
            {submitSuccess ? (
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Your booking request has been submitted successfully!  
                  {teacher.name} will review your request and contact you soon.
                </p>
                <p className="text-sm text-gray-500">
                  You should receive a confirmation email shortly.
                </p>
              </div>
            ) : (
              <>
                {/* Booking Form */}
                <form onSubmit={handleSubmit}>
                {submitError && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {submitError}
                  </div>
                )}
                
                {/* Render custom fields from bookingSettings */}
                {customFields.length > 0 ? (
                  customFields.map((field, idx) => (
                    <div key={idx} className="mb-4">
                      <label className="block font-medium mb-1" htmlFor={`field-${idx}`}>
                        {field.label || field.name}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          id={`field-${idx}`}
                          name={field.name}
                          required={field.required}
                          value={formData[field.name] || ''}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 resize-vertical min-h-[80px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={`Enter your ${field.label?.toLowerCase() || field.name}`}
                          disabled={isSubmitting}
                        />
                      ) : field.name === 'phone' ? (
                        <input
                          id={`field-${idx}`}
                          name={field.name}
                          type="tel"
                          required={field.required}
                          value={formData[field.name] || ''}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="(555) 123-4567"
                          disabled={isSubmitting}
                          maxLength={14}
                        />
                      ) : field.name === 'dates' ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Preferred Start Date
                            </label>
                            <input
                              id={`field-${idx}-start`}
                              name="startDate"
                              type="date"
                              required={field.required}
                              value={formData.startDate || ''}
                              onChange={handleInputChange}
                              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              disabled={isSubmitting}
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Preferred End Date (Optional)
                            </label>
                            <input
                              id={`field-${idx}-end`}
                              name="endDate"
                              type="date"
                              value={formData.endDate || ''}
                              onChange={handleInputChange}
                              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              disabled={isSubmitting}
                              min={formData.startDate || new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          <p className="text-xs text-gray-500">
                            Select a date range for your preferred booking period. End date is optional for single sessions.
                          </p>
                        </div>
                      ) : (
                        <input
                          id={`field-${idx}`}
                          name={field.name}
                          type={field.type || "text"}
                          required={field.required}
                          value={formData[field.name] || ''}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={`Enter your ${field.label?.toLowerCase() || field.name}`}
                          disabled={isSubmitting}
                        />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 font-medium mb-2">Contact Request</p>
                    <p className="text-blue-600 text-sm">
                      No custom fields are configured. Click below to send a general booking request to {teacher.name}.
                    </p>
                  </div>
                )}
                
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-primary text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-primaryHover transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
                  style={{ backgroundColor: isSubmitting ? '#gray' : colorScheme.styles.primary }}
                >
                  {isSubmitting ? 'Submitting...' : customFields.length > 0 ? 'Submit Request' : 'Send Contact Request'}
                </button>
              </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
