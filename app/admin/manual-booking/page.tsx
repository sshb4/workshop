'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'
import Link from 'next/link'

interface ManualBookingForm {
  studentName: string
  studentEmail: string
  studentPhone: string
  bookingDate: string
  startTime: string
  endTime: string
  amountPaid: string
  paymentStatus: string
  notes: string
}

export default function ManualBookingPage() {
  const { status } = useSession()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState<ManualBookingForm>({
    studentName: '',
    studentEmail: '',
    studentPhone: '',
    bookingDate: '',
    startTime: '',
    endTime: '',
    amountPaid: '',
    paymentStatus: 'paid',
    notes: ''
  })

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need to be logged in to access this page.</p>
        </div>
      </div>
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/manual-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          amountPaid: formData.amountPaid ? parseFloat(formData.amountPaid) : 0
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Booking created successfully!')
        // Reset form
        setFormData({
          studentName: '',
          studentEmail: '',
          studentPhone: '',
          bookingDate: '',
          startTime: '',
          endTime: '',
          amountPaid: '',
          paymentStatus: 'paid',
          notes: ''
        })
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch {
      setMessage('An error occurred while creating the booking')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="mb-6">
              <Link 
                href="/admin/dashboard" 
                className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                ← Back to Dashboard
              </Link>
            </div>

            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Add Manual Booking</h1>
              <p className="mt-1 text-sm text-gray-600">
                Create a booking manually for a student. This is useful for in-person bookings or phone reservations.
              </p>
            </div>

            {message && (
              <div className={`mb-4 p-4 rounded-md ${
                message.startsWith('Error') || message.includes('error') 
                  ? 'bg-red-50 text-red-700' 
                  : 'bg-green-50 text-green-700'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Student Information</h3>
                
                <div>
                  <label htmlFor="studentName" className="block text-sm font-medium text-gray-700">
                    Student Name *
                  </label>
                  <input
                    type="text"
                    id="studentName"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="studentEmail" className="block text-sm font-medium text-gray-700">
                    Student Email *
                  </label>
                  <input
                    type="email"
                    id="studentEmail"
                    name="studentEmail"
                    value={formData.studentEmail}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="studentPhone" className="block text-sm font-medium text-gray-700">
                    Student Phone
                  </label>
                  <input
                    type="tel"
                    id="studentPhone"
                    name="studentPhone"
                    value={formData.studentPhone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  />
                </div>
              </div>

              {/* Booking Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Booking Details</h3>
                
                <div>
                  <label htmlFor="bookingDate" className="block text-sm font-medium text-gray-700">
                    Booking Date *
                  </label>
                  <input
                    type="date"
                    id="bookingDate"
                    name="bookingDate"
                    value={formData.bookingDate}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      id="startTime"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    />
                  </div>

                  <div>
                    <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                      End Time *
                    </label>
                    <input
                      type="time"
                      id="endTime"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Payment Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="amountPaid" className="block text-sm font-medium text-gray-700">
                      Amount Paid ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      id="amountPaid"
                      name="amountPaid"
                      value={formData.amountPaid}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    />
                  </div>

                  <div>
                    <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700">
                      Payment Status
                    </label>
                    <select
                      id="paymentStatus"
                      name="paymentStatus"
                      value={formData.paymentStatus}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    >
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="partial">Partial</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  placeholder="Any additional notes about this booking..."
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Creating Booking...' : 'Create Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
