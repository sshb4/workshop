'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function SetupPage() {
  const { status } = useSession()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form states
  const [bookingSettings, setBookingSettings] = useState({
    name: true,
    email: true,
    phone: true,
    description: false,
    preferredDate: true,
    budget: false,
    experience: false,
    goals: false
  })

  const [profileData, setProfileData] = useState({
    bio: '',
    hourlyRate: '',
    photo: null as File | null
  })

  const [photoPreview, setPhotoPreview] = useState<string>('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    }
  }, [status, router])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfileData(prev => ({ ...prev, photo: file }))
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBookingSettingChange = (field: string, value: boolean) => {
    setBookingSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSkipStep = () => {
    if (step < 2) {
      setStep(step + 1)
    } else {
      // Skip to dashboard
      router.push('/admin/dashboard')
    }
  }

  const handleSaveAndContinue = async () => {
    setLoading(true)
    setError('')

    try {
      if (step === 1) {
        // Save booking settings
        const response = await fetch('/api/booking-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            settings: {
              // Use default booking settings values
              minAdvanceBooking: 2,
              maxAdvanceBooking: 30,
              sessionDuration: 60,
              bufferTime: 15,
              allowWeekends: true,
              allowSameDayBooking: false,
              cancellationPolicy: 24,
              maxSessionsPerDay: 8,
              allowCustomerBook: true,
              allowManualBook: true,
              formFields: bookingSettings
            },
            blockedDates: [] // No blocked dates during setup
          })
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to save booking settings')
        }

        setSuccess('Booking settings saved!')
        setTimeout(() => {
          setStep(2)
          setSuccess('')
        }, 1000)
      } else if (step === 2) {
        // Save profile data
        const formData = new FormData()
        formData.append('bio', profileData.bio)
        formData.append('hourlyRate', profileData.hourlyRate)
        if (profileData.photo) {
          formData.append('photo', profileData.photo)
        }

        const response = await fetch('/api/profile', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to save profile')
        }

        setSuccess('Profile saved! Redirecting to dashboard...')
        setTimeout(() => {
          router.push('/admin/dashboard')
        }, 1500)
      }
    } catch (error) {
      console.error('Setup error:', error)
      setError(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mb-6"></div>
          <h2 className="text-xl font-semibold text-indigo-700">Setting up your account...</h2>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome! Let&apos;s set up your profile
          </h1>
          <p className="text-gray-600">
            Don&apos;t worry, you can change these settings anytime later
          </p>
          
          {/* Progress Steps */}
          <div className="flex justify-center items-center mt-6 space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              step >= 1 ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 text-gray-300'
            }`}>
              1
            </div>
            <div className={`h-1 w-16 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              step >= 2 ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 text-gray-300'
            }`}>
              2
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600 max-w-48 mx-auto">
            <span>Booking Form</span>
            <span>Profile Info</span>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-600">{success}</p>
          </div>
        )}

        {/* Step 1: Booking Settings */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Customize Your Booking Form
            </h2>
            <p className="text-gray-600 mb-6">
              Choose which information you&apos;d like students to provide when booking with you:
            </p>

            <div className="space-y-4">
              {Object.entries({
                name: 'Full Name',
                email: 'Email Address', 
                phone: 'Phone Number',
                description: 'Project Description',
                preferredDate: 'Preferred Date Range',
                budget: 'Budget Range',
                experience: 'Experience Level',
                goals: 'Learning Goals'
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">{label}</span>
                    {key === 'name' || key === 'email' ? (
                      <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                        Required
                      </span>
                    ) : null}
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bookingSettings[key as keyof typeof bookingSettings]}
                      onChange={(e) => handleBookingSettingChange(key, e.target.checked)}
                      disabled={key === 'name' || key === 'email'}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${
                      bookingSettings[key as keyof typeof bookingSettings] 
                        ? 'bg-indigo-600' 
                        : 'bg-gray-300'
                    } ${key === 'name' || key === 'email' ? 'opacity-50' : ''}`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                        bookingSettings[key as keyof typeof bookingSettings] 
                          ? 'translate-x-5' 
                          : 'translate-x-0'
                      } mt-0.5 ml-0.5`}></div>
                    </div>
                  </label>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <div className="flex">
                <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-blue-900 font-medium">Preview Your Form</h4>
                  <p className="text-blue-700 text-sm mt-1">
                    Students will see a form with the selected fields when they want to book a session with you.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Profile Information */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Complete Your Profile
            </h2>
            <p className="text-gray-600 mb-6">
              Add some details about yourself to help students get to know you:
            </p>

            <div className="space-y-6">
              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Photo (Optional)
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {photoPreview ? (
                      <Image 
                        src={photoPreview} 
                        alt="Profile preview" 
                        width={80} 
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <label className="cursor-pointer bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <span>Choose Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  About You (Optional)
                </label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                  placeholder="Tell students about your experience, teaching style, specialties..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">This will appear on your booking page</p>
              </div>

              {/* Price Per Hour */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Per Hour (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    value={profileData.hourlyRate}
                    onChange={(e) => setProfileData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                    placeholder="50"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Students will see this rate when booking</p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
              <div className="flex">
                <svg className="w-5 h-5 text-green-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-green-900 font-medium">Almost Done!</h4>
                  <p className="text-green-700 text-sm mt-1">
                    You can update all these settings anytime from your dashboard settings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={handleSkipStep}
            className="text-gray-600 hover:text-gray-800 font-medium"
          >
            {step === 1 ? 'Skip for now' : 'Finish later'}
          </button>

          <div className="flex space-x-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Back
              </button>
            )}
            <button
              onClick={handleSaveAndContinue}
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : step === 2 ? 'Complete Setup' : 'Save & Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
