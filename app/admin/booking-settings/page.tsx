// app/admin/booking-settings/page.tsx

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import BackArrowIcon from '@/components/icons/BackArrowIcon';
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface BookingSettings {
  minAdvanceBooking: number // hours
  maxAdvanceBooking: number // days
  sessionDuration: number // minutes
  bufferTime: number // minutes between sessions
  allowSameDayBooking: boolean
  cancellationPolicy: number // hours before session
  maxSessionsPerDay: number
  allowCustomerBook: boolean
  allowManualBook: boolean
  formFields?: {
    address?: boolean
    dates?: boolean
    description?: boolean
    phone?: boolean
    email?: boolean
    name?: boolean
  }
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
    allowSameDayBooking: false,
    cancellationPolicy: 24,
    maxSessionsPerDay: 8,
    allowCustomerBook: true,
    allowManualBook: true,
    formFields: {
      address: true,
      dates: true,
      description: true,
      phone: true,
      email: true,
      name: true
    }
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
        body: JSON.stringify({ settings })
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
          {/* Form Field Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Booking Request Form Fields</h2>
            <div className="flex flex-col gap-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={!!settings.formFields?.name}
                  onChange={e => setSettings({ ...settings, formFields: { ...settings.formFields, name: e.target.checked } })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="text-sm text-gray-700 font-medium">Name</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={!!settings.formFields?.email}
                  onChange={e => setSettings({ ...settings, formFields: { ...settings.formFields, email: e.target.checked } })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="text-sm text-gray-700 font-medium">Email</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={!!settings.formFields?.phone}
                  onChange={e => setSettings({ ...settings, formFields: { ...settings.formFields, phone: e.target.checked } })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="text-sm text-gray-700 font-medium">Phone</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={!!settings.formFields?.address}
                  onChange={e => setSettings({ ...settings, formFields: { ...settings.formFields, address: e.target.checked } })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="text-sm text-gray-700 font-medium">Address</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={!!settings.formFields?.dates}
                  onChange={e => setSettings({ ...settings, formFields: { ...settings.formFields, dates: e.target.checked } })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="text-sm text-gray-700 font-medium">Date(s) Requested</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={!!settings.formFields?.description}
                  onChange={e => setSettings({ ...settings, formFields: { ...settings.formFields, description: e.target.checked } })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="text-sm text-gray-700 font-medium">Description</span>
              </label>
            </div>
            <div className="text-xs text-gray-500 mt-2">Select which fields customers must fill out when requesting a booking.</div>
          </div>
          {/* Booking Mode Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Booking Mode</h2>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="allowCustomerBook"
                  checked={settings.allowCustomerBook}
                  onChange={e => setSettings({ ...settings, allowCustomerBook: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="allowCustomerBook" className="text-sm text-gray-700 font-medium flex items-center gap-2">
                  Customer Book
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="allowManualBook"
                  checked={settings.allowManualBook}
                  onChange={e => setSettings({ ...settings, allowManualBook: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="allowManualBook" className="text-sm text-gray-700 font-medium flex items-center gap-2">
                  Manual Book
                </label>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                <span className="font-semibold">Customer Book</span> requires them to fill out a booking & invoice form. If only <span className="font-semibold">Manual Book</span> is selected, the calendar with your availability will be hidden and customers will see a &quot;Call to schedule an appointment&quot; message instead.
              </div>
            </div>
          </div>
          {/* General Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">General Booking Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="sessionDuration" className="block text-sm font-medium text-gray-700 mb-2">
                  Session Duration (minutes)
                </label>
                <input
                  id="sessionDuration"
                  type="number"
                  value={settings.sessionDuration || ''}
                  onChange={(e) => setSettings({...settings, sessionDuration: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900"
                  min="15"
                  max="480"
                />
              </div>

              <div>
                <label htmlFor="bufferTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Buffer Time Between Sessions (minutes)
                </label>
                <input
                  id="bufferTime"
                  type="number"
                  value={settings.bufferTime || ''}
                  onChange={(e) => setSettings({...settings, bufferTime: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900"
                  min="0"
                  max="120"
                />
              </div>

              <div>
                <label htmlFor="minAdvanceBooking" className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Advance Booking (hours)
                </label>
                <input
                  id="minAdvanceBooking"
                  type="number"
                  value={settings.minAdvanceBooking || ''}
                  onChange={(e) => setSettings({...settings, minAdvanceBooking: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900"
                  min="0"
                  max="168"
                />
              </div>

              <div>
                <label htmlFor="maxAdvanceBooking" className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Advance Booking (days)
                </label>
                <input
                  id="maxAdvanceBooking"
                  type="number"
                  value={settings.maxAdvanceBooking || ''}
                  onChange={(e) => setSettings({...settings, maxAdvanceBooking: parseInt(e.target.value) || 1})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900"
                  min="1"
                  max="365"
                />
              </div>

              <div>
                <label htmlFor="maxSessionsPerDay" className="block text-sm font-medium text-gray-700 mb-2">
                  Max Sessions Per Day
                </label>
                <input
                  id="maxSessionsPerDay"
                  type="number"
                  value={settings.maxSessionsPerDay || ''}
                  onChange={(e) => setSettings({...settings, maxSessionsPerDay: parseInt(e.target.value) || 1})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900"
                  min="1"
                  max="20"
                />
              </div>

              <div>
                <label htmlFor="cancellationPolicy" className="block text-sm font-medium text-gray-700 mb-2">
                  Cancellation Policy (hours before)
                </label>
                <input
                  id="cancellationPolicy"
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