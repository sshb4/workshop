'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BackArrowIcon from '@/components/icons/BackArrowIcon'

interface Invoice {
  id: string
  invoiceNumber?: string
  status: string
  amount: number
  dueDate: string
  createdAt: string
  booking?: {
    studentName: string
    studentEmail: string
  }
  items: {
    title: string
    description?: string
    quantity: number
    unitPrice: number
  }[]
}

interface Booking {
  id: string
  studentName: string
  studentEmail: string
  bookingDate: string
  startTime: string
  endTime: string
  amountPaid: number
}

export const dynamic = 'force-dynamic'

export default function InvoicesPage() {
  const { status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<string>('')
  const [creating, setCreating] = useState(false)

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/invoices')
      if (response.ok) {
        const data = await response.json()
        setInvoices(data.invoices || [])
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
    }
  }

  const fetchBookings = useCallback(async () => {
    try {
      const response = await fetch('/api/bookings')
      if (response.ok) {
        const data = await response.json()
        // Filter bookings that don't have invoices yet
        const bookingsWithoutInvoices = data.bookings?.filter((booking: Booking) => 
          !invoices.some(invoice => invoice.booking?.studentEmail === booking.studentEmail)
        ) || []
        setBookings(bookingsWithoutInvoices)
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    }
  }, [invoices])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    } else if (status === 'authenticated') {
      setLoading(false)
      fetchInvoices()
      fetchBookings()
    }
  }, [status, router, fetchBookings])

  const createInvoice = async () => {
    if (!selectedBooking) return
    
    setCreating(true)
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: selectedBooking
        })
      })

      if (response.ok) {
        setShowCreateModal(false)
        setSelectedBooking('')
        fetchInvoices()
        fetchBookings()
      } else {
        const error = await response.json()
        alert(`Failed to create invoice: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to create invoice:', error)
      alert('Failed to create invoice')
    } finally {
      setCreating(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/dashboard"
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <BackArrowIcon className="w-6 h-6" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={bookings.length === 0}
              className={`px-4 py-2 rounded-lg transition ${
                bookings.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              Create Invoice
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {invoices.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices yet</h3>
              <p className="text-gray-600 mb-4">Create your first invoice to get started</p>
              {bookings.length > 0 && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Create Your First Invoice
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Invoice #{invoice.invoiceNumber || invoice.id}
                    </h3>
                    {invoice.booking && (
                      <p className="text-gray-600 mt-1">
                        For: {invoice.booking.studentName} ({invoice.booking.studentEmail})
                      </p>
                    )}
                    <div className="mt-2 space-y-1">
                      {invoice.items.map((item, idx) => (
                        <p key={idx} className="text-sm text-gray-600">
                          {item.title} - {item.quantity} × ${item.unitPrice}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      invoice.status === 'Paid' 
                        ? 'bg-green-100 text-green-800' 
                        : invoice.status === 'Cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {invoice.status}
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mt-2">
                      ${invoice.amount}
                    </p>
                    <p className="text-sm text-gray-600">
                      Due: {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Invoice Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Create Invoice</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Booking
                  </label>
                  <select
                    value={selectedBooking}
                    onChange={(e) => setSelectedBooking(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Choose a booking...</option>
                    {bookings.map((booking) => (
                      <option key={booking.id} value={booking.id}>
                        {booking.studentName} - {new Date(booking.bookingDate).toLocaleDateString()} (${booking.amountPaid})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setSelectedBooking('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  onClick={createInvoice}
                  disabled={!selectedBooking || creating}
                  className={`flex-1 px-4 py-2 rounded-lg ${
                    !selectedBooking || creating
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {creating ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
