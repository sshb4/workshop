'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BackArrowIcon from '@/components/icons/BackArrowIcon';

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

interface BlockedDate {
  id: string
  startDate: string
  endDate: string
  reason: string
  isRecurring: boolean
  recurringType?: 'weekly' | 'monthly'
}

const DAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
]

function AvailabilityContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [sortType, setSortType] = useState<'added' | 'furthest' | 'closest'>('added')
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])

  // Helper to check if a date is blocked
  function isDateBlocked(dateStr: string) {
    const date = new Date(dateStr)
    return blockedDates.some(blocked => {
      const start = new Date(blocked.startDate)
      const end = new Date(blocked.endDate || blocked.startDate)
      // If recurring, only block matching day of week
      if (blocked.isRecurring && blocked.recurringType === 'weekly') {
        return date.getDay() === start.getDay()
      }
      // Otherwise block date range
      return date >= start && date <= end
    })
  }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showBlockForm, setShowBlockForm] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    selectedDays: [] as number[], // Changed to array for multiple days
    startTime: '09:00',
    endTime: '17:00'
  })

  const [blockFormData, setBlockFormData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    isRecurring: false,
    recurringType: 'weekly' as 'weekly' | 'monthly'
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
        // Filter out slots that fall on blocked dates
  const filteredSlots = (data.availabilitySlots || []).filter((slot: AvailabilitySlot) => {
          // Check if any day in slot's date range is blocked
          let blocked = false
          const start = new Date(slot.startDate)
          const end = slot.endDate ? new Date(slot.endDate) : start
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            if (isDateBlocked(d.toISOString().split('T')[0])) {
              blocked = true
              break
            }
          }
          return !blocked
        })
        setSlots(filteredSlots)
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

  const fetchBlockedDates = useCallback(async () => {
    try {
      const response = await fetch('/api/blocked-dates')
      if (response.ok) {
        const data = await response.json()
        setBlockedDates(data.blockedDates || [])
      }
    } catch (error) {
      console.error('Error fetching blocked dates:', error)
    }
  }, [])

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

  // Load blocked dates on component mount
  useEffect(() => {
    if (status === 'authenticated') {
      fetchBlockedDates()
    }
  }, [status, fetchBlockedDates])

  if (status === 'loading') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mb-6"></div>
        <h2 className="text-xl font-semibold text-indigo-700 mb-2">Loading Availability</h2>
        <p className="text-gray-500">Please wait while we fetch your schedule...</p>
      </div>
    </div>
  )
  if (status === 'unauthenticated') return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (formData.selectedDays.length === 0) {
      setError('Please select at least one day of the week')
      return
    }

    try {
      // Prevent creating slots on blocked days
      // Create slots for all unblocked dates in the selected range for each selected day
      const start = new Date(formData.startDate)
      const end = formData.endDate ? new Date(formData.endDate) : start
      const slotRequests: Promise<Response>[] = [];
      const createdDates: string[] = [];
      const formatUSDate = (date: Date) => {
        const yyyy = date.getFullYear();
        const mm = (date.getMonth() + 1).toString().padStart(2, '0');
        const dd = date.getDate().toString().padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };
      const dayCount = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      for (let i = 0; i <= dayCount; i++) {
        const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
        formData.selectedDays.forEach(dayOfWeek => {
          if (d.getDay() === dayOfWeek && !isDateBlocked(formatUSDate(d))) {
            // If the range is only one day, omit endDate
            const isSingleDay = start.getTime() === end.getTime();
            const slotPayload: Partial<AvailabilitySlot> = {
              ...formData,
              dayOfWeek,
              startDate: formatUSDate(d),
              title: formData.title || `${DAYS[dayOfWeek]} Availability`
            };
            if (!isSingleDay) {
              slotPayload.endDate = formatUSDate(end);
            }
            slotRequests.push(
              fetch('/api/availability', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(slotPayload)
              })
            );
            createdDates.push(formatUSDate(d));
          }
        });
      }
      if (slotRequests.length === 0) {
        setError('No availability created: all selected dates are blocked.')
        return;
      }
      const responses = await Promise.all(slotRequests);
      const results = await Promise.all(responses.map(r => r.json()));
      const allSuccessful = responses.every(r => r.ok);
      if (allSuccessful) {
        setSuccess(`Availability created for dates: ${createdDates.join(', ')}`);
        setShowForm(false);
        setFormData({
          title: '',
          startDate: '',
          endDate: '',
          selectedDays: [],
          startTime: '09:00',
          endTime: '17:00'
        });
        fetchAvailability();
      } else {
        const errors = results.filter((result, index) => !responses[index].ok);
        setError(errors[0]?.error || 'Some availability periods could not be created');
      }
    } catch (error) {
      console.error('Error creating availability:', error);
      setError('Something went wrong. Please try again.');
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

  async function handleBlockSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!blockFormData.startDate) {
      setError('Please select a start date')
      return
    }

    try {
      const blocked: BlockedDate = {
        id: Date.now().toString(),
        startDate: blockFormData.startDate,
        endDate: blockFormData.endDate || blockFormData.startDate,
        reason: blockFormData.reason || 'Unavailable',
        isRecurring: blockFormData.isRecurring,
        recurringType: blockFormData.isRecurring ? blockFormData.recurringType : undefined
      }

      const response = await fetch('/api/blocked-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blocked)
      })

      if (response.ok) {
        setSuccess('Blocked date added successfully!')
        setShowBlockForm(false)
        setBlockFormData({
          startDate: '',
          endDate: '',
          reason: '',
          isRecurring: false,
          recurringType: 'weekly'
        })
        // Refresh blocked dates
        fetchBlockedDates()
      } else {
        const result = await response.json()
        setError(result.error || 'Failed to add blocked date')
      }
    } catch (error) {
      console.error('Error adding blocked date:', error)
      setError('Something went wrong. Please try again.')
    }
  }

  async function removeBlockedDate(id: string) {
    if (!confirm('Are you sure you want to remove this blocked date?')) return

    try {
      const response = await fetch(`/api/blocked-dates?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess('Blocked date removed successfully!')
        fetchBlockedDates()
      } else {
        const result = await response.json()
        setError(result.error || 'Failed to remove blocked date')
      }
    } catch (error) {
      console.error('Error removing blocked date:', error)
      setError('Failed to remove blocked date')
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString()
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
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
          <div className="flex items-center gap-4 py-4">
            <Link 
              href="/admin/dashboard"
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Availability Management</h1>
              <p className="text-sm text-gray-600">Set up your flexible schedule periods</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded flex items-center gap-3">
            <p className="text-red-700 flex-1">{error}</p>
            <Link 
              href="/admin/dashboard"
              className="text-gray-500 hover:text-gray-700"
              title="Back to Dashboard"
            >
              <BackArrowIcon className="w-6 h-6" />
            </Link>
          </div>
        )}

        {/* Current Availability Section */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center p-6 border-b border-gray-200 gap-4">
            <h2 className="text-xl font-semibold text-gray-900">Current Availability Periods</h2>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-900 font-medium">Sort by:</label>
              <select
                value={sortType}
                onChange={e => setSortType(e.target.value as 'added' | 'furthest' | 'closest')}
                className="px-2 py-1 border rounded-md text-sm text-gray-900 bg-gray-100"
              >
                <option value="added">Added Date</option>
                <option value="furthest">Furthest</option>
                <option value="closest">Closest</option>
              </select>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                {showForm ? 'Cancel' : 'Add Period'}
              </button>
            </div>
          </div>
          {showForm && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Availability Period</h3>
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
                      Quick Select
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, selectedDays: [1, 2, 3, 4, 5] }))} // Mon-Fri
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        Weekdays
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, selectedDays: [0, 6] }))} // Sun, Sat
                        className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors"
                      >
                        Weekends
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, selectedDays: [] }))}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Days of Week
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {DAYS.map((day, index) => (
                      <label key={index} className="flex flex-col items-center">
                        <input
                          type="checkbox"
                          checked={formData.selectedDays.includes(index)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                selectedDays: [...prev.selectedDays, index].sort()
                              }))
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                selectedDays: prev.selectedDays.filter(d => d !== index)
                              }))
                            }
                          }}
                          className="mb-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="text-xs text-gray-700 text-center">
                          {day.slice(0, 3)}
                        </span>
                      </label>
                    ))}
                  </div>
                  {formData.selectedDays.length > 0 && (
                    <p className="text-sm text-indigo-600 mt-2">
                      Selected: {formData.selectedDays.map(day => DAYS[day]).join(', ')}
                    </p>
                  )}
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
              {(() => {
                const sortedSlots = [...slots];
                if (sortType === 'furthest') {
                  sortedSlots.sort((a, b) => {
                    const aDate = new Date(a.startDate);
                    const bDate = new Date(b.startDate);
                    return bDate.getTime() - aDate.getTime();
                  });
                } else if (sortType === 'closest') {
                  sortedSlots.sort((a, b) => {
                    const aDate = new Date(a.startDate);
                    const bDate = new Date(b.startDate);
                    return aDate.getTime() - bDate.getTime();
                  });
                } // 'added' is default order
                return sortedSlots.map((slot) => (
                  <div key={slot.id} className="p-6 flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {slot.title || 'Unnamed Period'}
                        </h3>
                        <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-gray-900 rounded-full">
                          {DAYS[slot.dayOfWeek]}
                        </span>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-900">
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
                ));
              })()}
            </div>
          )}
        </div>

        {/* Blocked Dates Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Blocked Dates</h2>
              <p className="text-sm text-gray-600">Block out dates when you&apos;re unavailable</p>
            </div>
            <button
              onClick={() => setShowBlockForm(!showBlockForm)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              {showBlockForm ? 'Cancel' : 'Block Date'}
            </button>
          </div>

          {/* Block Date Form */}
          {showBlockForm && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Blocked Date</h3>
              
              <form onSubmit={handleBlockSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={blockFormData.startDate}
                      onChange={(e) => setBlockFormData({...blockFormData, startDate: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
                    <input
                      type="date"
                      value={blockFormData.endDate}
                      onChange={(e) => setBlockFormData({...blockFormData, endDate: e.target.value})}
                      min={blockFormData.startDate}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900"
                    />
                    <p className="text-sm text-gray-500 mt-1">Leave empty for single day</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                    <input
                      type="text"
                      value={blockFormData.reason}
                      onChange={(e) => setBlockFormData({...blockFormData, reason: e.target.value})}
                      placeholder="e.g., Vacation, Holiday, Personal"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isRecurring"
                      checked={blockFormData.isRecurring}
                      onChange={(e) => setBlockFormData({...blockFormData, isRecurring: e.target.checked})}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isRecurring" className="ml-2 text-sm text-gray-700">
                      Make this recurring
                    </label>
                  </div>

                  {blockFormData.isRecurring && (
                    <div className="ml-6">
                      <select
                        value={blockFormData.recurringType}
                        onChange={(e) => setBlockFormData({...blockFormData, recurringType: e.target.value as 'weekly' | 'monthly'})}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="weekly">Every week</option>
                        <option value="monthly">Every month</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowBlockForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Block Date
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Blocked Dates List */}
          <div className="space-y-3">
            {blockedDates.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No blocked dates yet</p>
            ) : (
              blockedDates.map((blocked) => (
                <div key={blocked.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {blocked.startDate === blocked.endDate || !blocked.endDate
                          ? formatDate(blocked.startDate)
                          : `${formatDate(blocked.startDate)} - ${formatDate(blocked.endDate)}`
                        }
                      </span>
                      {blocked.isRecurring && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          {blocked.recurringType}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{blocked.reason}</p>
                  </div>
                  <button
                    onClick={() => removeBlockedDate(blocked.id)}
                    className="text-red-600 hover:text-red-800 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
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
          <Link href="/admin/dashboard" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }
}