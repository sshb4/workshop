'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import ErrorMessage from '@/components/ErrorMessage'

interface SelectedSlot {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  dayName: string
  customStartTime?: string
  customEndTime?: string
}

interface TeacherInfo {
  id: string
  name: string
  subdomain: string
  hourlyRate?: number
  title?: string
}

interface BookingFormData {
  customerName: string
  customerEmail: string
  customerPhone: string
  additionalNotes: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const params = useParams()
  const subdomain = params?.subdomain as string
  
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([])
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null)
  const [formData, setFormData] = useState<BookingFormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    additionalNotes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    // Load data from sessionStorage
    const savedSlots = sessionStorage.getItem('selectedSlots')
    const savedTeacher = sessionStorage.getItem('teacherInfo')
    
    if (!savedSlots || !savedTeacher) {
      // Redirect back to booking page if no data
      router.push(`/${subdomain}`)
      return
    }

    try {
      setSelectedSlots(JSON.parse(savedSlots))
      setTeacherInfo(JSON.parse(savedTeacher))
    } catch (error) {
      console.error('Error parsing booking data:', error)
      router.push(`/${subdomain}`)
    }
  }, [subdomain, router])

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
    if (!teacherInfo?.hourlyRate) return 0
    return getTotalHours() * teacherInfo.hourlyRate
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError('')

    try {
      // Submit the actual booking
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacherId: teacherInfo?.id,
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone,
          additionalNotes: formData.additionalNotes,
          selectedSlots: selectedSlots
        })
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMessage = result.error || 'Failed to create booking'
        setSubmitError(errorMessage)
        return
      }

      console.log('Booking created successfully:', result)
      
      // Clear session storage
      sessionStorage.removeItem('selectedSlots')
      sessionStorage.removeItem('teacherInfo')
      
      // Redirect to success page
      router.push(`/${subdomain}/booking-success`)
    } catch (error) {
      console.error('Booking submission error:', error)
      setSubmitError('There was an error creating your booking. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = () => {
    return formData.customerName.trim() !== '' && 
           formData.customerEmail.trim() !== ''
  }

  // Don't render anything until data is loaded
  if (!selectedSlots.length || !teacherInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={`/teacher/${subdomain}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to {teacherInfo.name}&apos;s Page
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Checkout</h1>
          <p className="text-xl text-gray-600 mt-2">Review your booking and complete your reservation</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Summary */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Booking Summary</h2>
            
            {/* Provider Info */}
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h3 className="text-lg font-medium text-gray-900">{teacherInfo.name}</h3>
              {teacherInfo.title && (
                <p className="text-gray-600">{teacherInfo.title}</p>
              )}
            </div>

            {/* Selected Slots */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Selected Time Slots</h4>
              <div className="space-y-2">
                {selectedSlots.map(slot => (
                  <div key={slot.id} className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-lg">
                    <span className="font-medium text-gray-900">{slot.dayName}</span>
                    <span className="text-gray-600">{slot.customStartTime || slot.startTime} - {slot.customEndTime || slot.endTime}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            {teacherInfo.hourlyRate && (
              <div className="border-t border-gray-200 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Total Hours:</span>
                    <span>{getTotalHours()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Hourly Rate:</span>
                    <span>${teacherInfo.hourlyRate}/hour</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total Cost:</span>
                    <span>${getTotalCost().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Customer Information Form */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Information</h2>
            
            {submitError && (
              <ErrorMessage message={submitError} className="mb-6" />
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="customerName"
                  name="customerName"
                  required
                  value={formData.customerName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="customerEmail"
                  name="customerEmail"
                  required
                  value={formData.customerEmail}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                  placeholder="Enter your email address"
                />
              </div>

              <div>
                <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="customerPhone"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  id="additionalNotes"
                  name="additionalNotes"
                  rows={4}
                  value={formData.additionalNotes}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                  placeholder="Any special requirements or notes for your booking..."
                />
              </div>

              <button
                type="submit"
                disabled={!isFormValid() || isSubmitting}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 ${
                  isFormValid() && !isSubmitting
                    ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Processing Booking...
                  </div>
                ) : (
                  'Complete Booking'
                )}
              </button>

              <p className="text-sm text-gray-500 text-center">
                By completing this booking, you agree to be contacted by {teacherInfo.name} to confirm your appointment details.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
