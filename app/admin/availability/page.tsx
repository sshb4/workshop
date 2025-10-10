'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

// Force this page to be client-only
export const dynamic = 'force-dynamic'

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

const DAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
]

function AvailabilityContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00'
  })

  const fetchAvailability = useCallback(async () => {
    if (!session?.user || !('id' in session.user) || status !== 'authenticated') {
      setLoading(false)
      return
    }
    
    try {
      const response = await fetch(`/api/availability?teacherId=${session.user.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setSlots(data.availabilitySlots)
      } else {
        setError(data.error || 'Failed to fetch availability')
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
      setError('Failed to fetch availability')
    } finally {
      setLoading(false)
    }
  }, [session, status])

  useEffect(() => {
    if (status === 'authenticated' && session?.user && 'id' in session.user) {
      fetchAvailability()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [session, fetchAvailability, status])

  // Handle authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    }
  }, [status, router])

  if (status === 'loading') return <div>Loading...</div>
  if (status === 'unauthenticated') return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess(result.message)
        setShowForm(false)
        setFormData({
          title: '',
          startDate: '',
          endDate: '',
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00'
        })
        fetchAvailability() // Refresh the list
      } else {
        setError(result.error)
      }
    } catch (error) {
      console.error('Error creating availability:', error)
      setError('Something went wrong. Please try again.')
    }
  }

  async function deleteSlot(slotId: string) {
    if (!confirm('Are you sure you want to delete this availability period?')) return

    try {
      const response = await fetch(`/api/availability?id=${slotId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess(result.message)
        fetchAvailability() // Refresh the list
      } else {
        setError(result.error)
      }
    } catch (error) {
      console.error('Error deleting availability:', error)
      setError('Failed to delete availability period')
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString()
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'dayOfWeek' ? parseInt(value) : value
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading availability...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <a 
                href="/admin/dashboard"
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </a>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Availability Management</h1>
                <p className="text-sm text-gray-600">Set up your flexible schedule periods</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                {showForm ? 'Cancel' : 'Add Period'}
              </button>
              <a
                href="/admin/dashboard"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Add Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Availability Period</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title (optional)
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Regular Hours, Holiday Schedule"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day of Week
                  </label>
                  <select
                    name="dayOfWeek"
                    value={formData.dayOfWeek}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  >
                    {DAYS.map((day, index) => (
                      <option key={index} value={index}>{day}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date (optional)
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for ongoing availability</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Add Period
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Availability List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Current Availability Periods</h2>
          </div>
          
          {slots.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-600">No availability periods set up yet.</p>
              <p className="text-gray-500 text-sm mt-1">Add your first availability period to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {slots.map((slot) => (
                <div key={slot.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {slot.title || 'Unnamed Period'}
                        </h3>
                        <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                          {DAYS[slot.dayOfWeek]}
                        </span>
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Time:</span> {slot.startTime} - {slot.endTime}
                        </div>
                        <div>
                          <span className="font-medium">Start:</span> {formatDate(slot.startDate)}
                        </div>
                        <div>
                          <span className="font-medium">End:</span> {slot.endDate ? formatDate(slot.endDate) : 'Ongoing'}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => deleteSlot(slot.id)}
                      className="text-red-600 hover:text-red-800 transition-colors p-2"
                      title="Delete this availability period"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Example Usage */}
        <div className="bg-blue-50 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 How it works</h3>
          <div className="text-blue-800 space-y-2 text-sm">
            <p><strong>Example:</strong> Set &quot;October 10 to December 5&quot; for &quot;Mondays 10:00-17:00&quot;</p>
            <p>• Clients will see available Monday slots only between those dates</p>
            <p>• You can overlap periods (e.g., different hours for holiday weeks)</p>
            <p>• Leave end date empty for ongoing availability</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AvailabilityPage() {
  try {
    return <AvailabilityContent />
  } catch (error) {
    console.error('Availability page error:', error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-600">Error loading page</h1>
          <p className="text-gray-600 mt-2">Please try refreshing or contact support.</p>
          <a href="/admin/dashboard" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded">
            Back to Dashboard
          </a>
        </div>
      </div>
    )
  }
}