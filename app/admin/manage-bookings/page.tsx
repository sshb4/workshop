'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Booking {
  id: string
  studentName: string
  studentEmail: string
  studentPhone: string
  bookingDate: string
  startTime: string
  endTime: string
  amountPaid: number
  paymentStatus: string
  notes: string | null
  createdAt: string
}

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

export default function ManageBookingsPage() {
  const { data: session, status } = useSession()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'manage' | 'add'>('manage')
  const [addBookingLoading, setAddBookingLoading] = useState(false)
  
  // Modal states
  const [deleteBookingId, setDeleteBookingId] = useState<string | null>(null)
  const [contactBooking, setContactBooking] = useState<Booking | null>(null)
  const [quoteBooking, setQuoteBooking] = useState<Booking | null>(null)
  const [quoteForm, setQuoteForm] = useState({
    description: '',
    amount: '',
    duration: '',
    notes: ''
  })
  
  // Sorting states
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'date'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
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

  useEffect(() => {
    if (session) {
      fetchBookings()
    }
  }, [session])

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings-manage')
      const data = await response.json()
      
      if (response.ok) {
        setBookings(data.bookings)
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch {
      setMessage('Failed to fetch bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings-manage?id=${bookingId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setBookings(bookings.filter(b => b.id !== bookingId))
        setMessage('Booking deleted successfully')
        setTimeout(() => setMessage(''), 3000)
      } else {
        const data = await response.json()
        setMessage(`Error: ${data.error}`)
      }
    } catch {
      setMessage('Failed to delete booking')
    }
    setDeleteBookingId(null)
  }

  const handleContactCustomer = (booking: Booking) => {
    // Open email client with pre-filled information
    const subject = `Re: Your booking request`
    const body = `Hi ${booking.studentName},\n\nThank you for your booking request. I'd like to discuss the details with you.\n\nBest regards`
    const mailtoUrl = `mailto:${booking.studentEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoUrl)
    setContactBooking(null)
  }

  const handleCreateQuote = async () => {
    if (!quoteBooking) return
    
    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: quoteBooking.id,
          description: quoteForm.description,
          amount: quoteForm.amount,
          duration: quoteForm.duration,
          notes: quoteForm.notes
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create quote')
      }

      const result = await response.json()
      
      if (result.emailError) {
        setMessage(`Quote created but email could not be sent to ${quoteBooking.studentName}. Please contact them manually.`)
      } else {
        setMessage(`Quote created and email sent to ${quoteBooking.studentName} (${quoteBooking.studentEmail})`)
      }
      
      setQuoteBooking(null)
      setQuoteForm({ description: '', amount: '', duration: '', notes: '' })
      
      // Refresh bookings to show updated information
      fetchBookings()
      
      setTimeout(() => setMessage(''), 5000)
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Failed to create quote'}`)
    }
  }

  const handleQuoteInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setQuoteForm(prev => ({ ...prev, [name]: value }))
  }

  const sortBookings = (bookingsToSort: Booking[]) => {
    return [...bookingsToSort].sort((a, b) => {
      let aVal: string | number
      let bVal: string | number

      switch (sortBy) {
        case 'name':
          aVal = a.studentName.toLowerCase()
          bVal = b.studentName.toLowerCase()
          break
        case 'status':
          aVal = a.paymentStatus
          bVal = b.paymentStatus
          break
        case 'date':
        default:
          aVal = new Date(a.createdAt).getTime()
          bVal = new Date(b.createdAt).getTime()
          break
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })
  }

  const sortedBookings = sortBookings(bookings)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddBookingLoading(true)
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
        // Refresh bookings list
        fetchBookings()
        // Switch back to manage tab
        setActiveTab('manage')
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch {
      setMessage('An error occurred while creating the booking')
    } finally {
      setAddBookingLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'request': return 'bg-orange-100 text-orange-800'
      case 'quote-sent': return 'bg-blue-100 text-blue-800'
      case 'partial': return 'bg-purple-100 text-purple-800'
      case 'refunded': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isUpcoming = (dateString: string) => {
    const bookingDate = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return bookingDate >= today
  }

  if (status === 'loading' || loading) {
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="mb-6">
              <Link 
                href="/admin/dashboard" 
                className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 mb-4"
              >
                ← Back to Dashboard
              </Link>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Bookings Management</h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Add new bookings or manage existing ones
                  </p>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="border-b border-gray-200 mt-6">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('manage')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'manage'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      Manage Bookings ({bookings.length})
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('add')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'add'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add New Booking
                    </span>
                  </button>
                </nav>
              </div>
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

            {/* Tab Content */}
            {activeTab === 'manage' ? (
              // Manage Bookings Tab
              bookings.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating a booking.</p>
                  <div className="mt-6">
                    <button
                      onClick={() => setActiveTab('add')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Add New Booking
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Sorting Controls */}
                  <div className="mb-4 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700">Sort by:</label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as 'name' | 'status' | 'date')}
                          className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="date">Date</option>
                          <option value="name">Student Name</option>
                          <option value="status">Status</option>
                        </select>
                      </div>
                      <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="flex items-center px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                      >
                        {sortOrder === 'asc' ? '↑' : '↓'} {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                      </button>
                    </div>
                  </div>

                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedBookings.map((booking) => (
                      <tr key={booking.id} className={isUpcoming(booking.bookingDate) ? 'bg-blue-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {booking.studentName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.studentEmail}
                            </div>
                            {booking.studentPhone && (
                              <div className="text-sm text-gray-500">
                                {booking.studentPhone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {booking.paymentStatus === 'request' ? (
                            <div>
                              <div className="text-sm text-gray-900">
                                Booking Request
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(booking.createdAt).toLocaleDateString()} - Submitted
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="text-sm text-gray-900">
                                {formatDate(booking.bookingDate)}
                                {isUpcoming(booking.bookingDate) && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Upcoming
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            ${booking.amountPaid.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.paymentStatus)}`}>
                            {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {booking.paymentStatus === 'request' ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setQuoteBooking(booking)}
                                className="text-indigo-600 hover:text-indigo-900 text-xs bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded"
                                title="Create Quote"
                              >
                                Quote
                              </button>
                              <button
                                onClick={() => setContactBooking(booking)}
                                className="text-blue-600 hover:text-blue-900 text-xs bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded"
                                title="Contact Customer"
                              >
                                Contact
                              </button>
                              <button
                                onClick={() => setDeleteBookingId(booking.id)}
                                className="text-red-600 hover:text-red-900 text-xs bg-red-50 hover:bg-red-100 px-2 py-1 rounded"
                                title="Delete Request"
                              >
                                Delete
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteBookingId(booking.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
              )
            ) : (
              // Add New Booking Tab
              <form onSubmit={handleAddBooking} className="space-y-6">
                {/* Student Information */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Student Information</h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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

                    <div className="sm:col-span-2">
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
                </div>

                {/* Booking Details */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Details</h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
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
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Notes</h3>
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
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('manage')}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addBookingLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {addBookingLoading ? 'Creating Booking...' : 'Create Booking'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Booking</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this booking? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteBookingId(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteBooking(deleteBookingId)}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {contactBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Customer</h3>
            <div className="space-y-3 mb-6">
              <div>
                <label className="text-sm font-medium text-gray-700">Customer:</label>
                <p className="text-gray-900">{contactBooking.studentName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email:</label>
                <p className="text-gray-900">{contactBooking.studentEmail}</p>
              </div>
              {contactBooking.studentPhone && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone:</label>
                  <p className="text-gray-900">{contactBooking.studentPhone}</p>
                </div>
              )}
              {contactBooking.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Notes:</label>
                  <p className="text-gray-900 text-sm bg-gray-50 p-2 rounded">{contactBooking.notes}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setContactBooking(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Close
              </button>
              <button
                onClick={() => handleContactCustomer(contactBooking)}
                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quote Creation Modal */}
      {quoteBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Create Quote for {quoteBooking.studentName}</h3>
            
            <form onSubmit={(e) => { e.preventDefault(); handleCreateQuote(); }} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Service Description
                </label>
                <textarea
                  name="description"
                  value={quoteForm.description}
                  onChange={handleQuoteInputChange}
                  rows={4}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 font-medium"
                  placeholder="Describe the service you'll provide in detail..."
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Quote Amount ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-bold text-lg">$</span>
                    <input
                      type="number"
                      name="amount"
                      value={quoteForm.amount}
                      onChange={handleQuoteInputChange}
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 font-bold text-lg"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Duration (hours)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={quoteForm.duration}
                    onChange={handleQuoteInputChange}
                    min="0"
                    step="0.5"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 font-bold text-lg"
                    placeholder="1.0"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={quoteForm.notes}
                  onChange={handleQuoteInputChange}
                  rows={3}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 font-medium"
                  placeholder="Any additional information, terms, or special requirements..."
                />
              </div>
              
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setQuoteBooking(null)
                    setQuoteForm({ description: '', amount: '', duration: '', notes: '' })
                  }}
                  className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold shadow-md transition-colors"
                >
                  Create & Send Quote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
