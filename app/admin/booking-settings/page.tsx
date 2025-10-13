// app/admin/booking-settings/page.tsx

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface BookingSettings {
  minAdvanceBooking: number // hours
  maxAdvanceBooking: number // days
  sessionDuration: number // minutes
  bufferTime: number // minutes between sessions
  allowWeekends: boolean
  allowSameDayBooking: boolean
  cancellationPolicy: number // hours before session
  maxSessionsPerDay: number
}

interface BlockedDate {
  id: string
  startDate: string
  endDate: string
  reason: string
  isRecurring: boolean
  recurringType?: 'weekly' | 'monthly'
}

export default function BookingSettingsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const [settings, setSettings] = useState<BookingSettings>({
    minAdvanceBooking: 2,
    maxAdvanceBooking: 30,
    sessionDuration: 60,
    bufferTime: 15,
    allowWeekends: true,
    allowSameDayBooking: false,
    cancellationPolicy: 24,
    maxSessionsPerDay: 8
  })

  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [newBlockedDate, setNewBlockedDate] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    isRecurring: false,
    recurringType: 'weekly' as 'weekly' | 'monthly'
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    }
  }, [status, router])

  useEffect(() => {
    const loadSettings = async () => {
      if (status === 'authenticated') {
        setLoading(true)
        try {
          const response = await fetch('/api/booking-settings')
          if (response.ok) {
            const data = await response.json()
            setSettings(data.settings)
            if (data.settings.blockedDates) {
              setBlockedDates(data.settings.blockedDates)
            }
          } else {
            console.error('Failed to load settings')
            setMessage('Failed to load existing settings')
          }
        } catch (error) {
          console.error('Error loading settings:', error)
          setMessage('Error loading settings')
        } finally {
          setLoading(false)
        }
      } else if (status === 'loading') {
        setLoading(true)
      } else {
        setLoading(false)
      }
    }
    
    loadSettings()
  }, [status])

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/booking-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, blockedDates })
      })

      if (response.ok) {
        setMessage('Settings saved successfully!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('Failed to save settings')
      }
    } catch {
      setMessage('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  const addBlockedDate = async () => {
    if (!newBlockedDate.startDate) return

    const blocked: BlockedDate = {
      id: Date.now().toString(),
      startDate: newBlockedDate.startDate,
      endDate: newBlockedDate.endDate || newBlockedDate.startDate, // Default to same date if no end date
      reason: newBlockedDate.reason || 'Unavailable',
      isRecurring: newBlockedDate.isRecurring,
      recurringType: newBlockedDate.isRecurring ? newBlockedDate.recurringType : undefined
    }

    const updatedBlockedDates = [...blockedDates, blocked]
    setBlockedDates(updatedBlockedDates)
    
    // Auto-save to database
    try {
      const response = await fetch('/api/booking-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, blockedDates: updatedBlockedDates })
      })

      if (response.ok) {
        setMessage('Blocked date added and saved!')
        setTimeout(() => setMessage(''), 2000)
      } else {
        setMessage('Blocked date added but failed to save - please click Save Settings')
      }
    } catch (error) {
      setMessage('Blocked date added but failed to save - please click Save Settings')
    }
    
    setNewBlockedDate({
      startDate: '',
      endDate: '',
      reason: '',
      isRecurring: false,
      recurringType: 'weekly'
    })
  }

  const removeBlockedDate = async (id: string) => {
    const updatedBlockedDates = blockedDates.filter(date => date.id !== id)
    setBlockedDates(updatedBlockedDates)
    
    // Auto-save to database
    try {
      const response = await fetch('/api/booking-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, blockedDates: updatedBlockedDates })
      })

      if (response.ok) {
        setMessage('Blocked date removed and saved!')
        setTimeout(() => setMessage(''), 2000)
      } else {
        setMessage('Blocked date removed but failed to save - please click Save Settings')
      }
    } catch (error) {
      setMessage('Blocked date removed but failed to save - please click Save Settings')
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
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Booking Settings</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('successfully') 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-8">
          {/* General Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">General Booking Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Duration (minutes)
                </label>
                <input
                  type="number"
                  value={settings.sessionDuration || ''}
                  onChange={(e) => setSettings({...settings, sessionDuration: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900"
                  min="15"
                  max="480"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buffer Time Between Sessions (minutes)
                </label>
                <input
                  type="number"
                  value={settings.bufferTime || ''}
                  onChange={(e) => setSettings({...settings, bufferTime: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900"
                  min="0"
                  max="120"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Advance Booking (hours)
                </label>
                <input
                  type="number"
                  value={settings.minAdvanceBooking || ''}
                  onChange={(e) => setSettings({...settings, minAdvanceBooking: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900"
                  min="0"
                  max="168"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Advance Booking (days)
                </label>
                <input
                  type="number"
                  value={settings.maxAdvanceBooking || ''}
                  onChange={(e) => setSettings({...settings, maxAdvanceBooking: parseInt(e.target.value) || 1})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900"
                  min="1"
                  max="365"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Sessions Per Day
                </label>
                <input
                  type="number"
                  value={settings.maxSessionsPerDay || ''}
                  onChange={(e) => setSettings({...settings, maxSessionsPerDay: parseInt(e.target.value) || 1})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900"
                  min="1"
                  max="20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cancellation Policy (hours before)
                </label>
                <input
                  type="number"
                  value={settings.cancellationPolicy || ''}
                  onChange={(e) => setSettings({...settings, cancellationPolicy: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900"
                  min="0"
                  max="168"
                />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowWeekends"
                  checked={settings.allowWeekends}
                  onChange={(e) => setSettings({...settings, allowWeekends: e.target.checked})}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="allowWeekends" className="ml-2 text-sm text-gray-700">
                  Allow weekend bookings
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowSameDay"
                  checked={settings.allowSameDayBooking}
                  onChange={(e) => setSettings({...settings, allowSameDayBooking: e.target.checked})}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="allowSameDay" className="ml-2 text-sm text-gray-700">
                  Allow same-day bookings
                </label>
              </div>
            </div>
          </div>

          {/* Blocked Dates */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Block Out Dates</h2>
            
            {/* Add New Blocked Date */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Blocked Date</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={newBlockedDate.startDate}
                    onChange={(e) => setNewBlockedDate({...newBlockedDate, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
                  <input
                    type="date"
                    value={newBlockedDate.endDate}
                    onChange={(e) => setNewBlockedDate({...newBlockedDate, endDate: e.target.value})}
                    min={newBlockedDate.startDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900"
                  />
                  <p className="text-sm text-gray-500 mt-1">Leave empty for single day</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                  <input
                    type="text"
                    value={newBlockedDate.reason || ''}
                    onChange={(e) => setNewBlockedDate({...newBlockedDate, reason: e.target.value})}
                    placeholder="e.g., Vacation, Holiday, Personal"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={newBlockedDate.isRecurring}
                    onChange={(e) => setNewBlockedDate({...newBlockedDate, isRecurring: e.target.checked})}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isRecurring" className="ml-2 text-sm text-gray-700">
                    Make this recurring
                  </label>
                </div>

                {newBlockedDate.isRecurring && (
                  <div className="ml-6">
                    <select
                      value={newBlockedDate.recurringType}
                      onChange={(e) => setNewBlockedDate({...newBlockedDate, recurringType: e.target.value as 'weekly' | 'monthly'})}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="weekly">Every week</option>
                      <option value="monthly">Every month</option>
                    </select>
                  </div>
                )}
              </div>

              <button
                onClick={addBlockedDate}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Add Blocked Date
              </button>
            </div>

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
                            ? new Date(blocked.startDate).toLocaleDateString()
                            : `${new Date(blocked.startDate).toLocaleDateString()} - ${new Date(blocked.endDate).toLocaleDateString()}`
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

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}