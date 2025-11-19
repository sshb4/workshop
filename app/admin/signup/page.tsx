'use client'

import { useState, FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ErrorMessage from '@/components/ErrorMessage'
import EyeIcon from '@/components/icons/EyeIcon';
import EyeClosedIcon from '@/components/icons/EyeClosedIcon';
import UserPlusIcon from '@/components/icons/UserPlusIcon'
import SpinnerIcon from '@/components/icons/SpinnerIcon';

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    subdomain: ''
  })
  
  // Setup form data
  const [bookingSettings, setBookingSettings] = useState({
    name: true,
    email: true,
    phone: false,
    address: false,
    dates: true,
    description: false
  })

  const [profileData, setProfileData] = useState({
    bio: '',
    hourlyRate: '',
    photo: null as File | null
  })
  
  const [photoPreview, setPhotoPreview] = useState<string>('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  // Password strength validation
  const validatePassword = (password: string) => {
    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
    
    const isValid = Object.values(requirements).every(req => req)
    return { requirements, isValid }
  }

  const passwordValidation = validatePassword(formData.password)
  
  // Calculate password strength
  const getPasswordStrength = () => {
    const { requirements } = passwordValidation
    const metRequirements = Object.values(requirements).filter(Boolean).length
    if (metRequirements === 0) return { level: 0, text: '', color: '' }
    if (metRequirements <= 2) return { level: 1, text: 'Weak', color: 'text-red-600 bg-red-100' }
    if (metRequirements <= 3) return { level: 2, text: 'Fair', color: 'text-yellow-600 bg-yellow-100' }
    if (metRequirements <= 4) return { level: 3, text: 'Good', color: 'text-blue-600 bg-blue-100' }
    return { level: 4, text: 'Strong', color: 'text-green-600 bg-green-100' }
  }
  
  const passwordStrength = getPasswordStrength()

  // Setup form handlers
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (step === 1) {
        // Step 1: Validate basic signup form
        if (!formData.name || !formData.email || !formData.password || !formData.subdomain) {
          setError('All fields are required')
          setLoading(false)
          return
        }

        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match')
          setLoading(false)
          return
        }

        // Validate password strength
        const { isValid } = validatePassword(formData.password)
        if (!isValid) {
          setError('Password does not meet security requirements')
          setLoading(false)
          return
        }

        // Validate subdomain format
        const subdomainRegex = /^[a-z0-9-]+$/
        if (!subdomainRegex.test(formData.subdomain)) {
          setError('Subdomain can only contain lowercase letters, numbers, and hyphens')
          setLoading(false)
          return
        }

        // Proceed to step 2
        setStep(2)
        setLoading(false)
        return
      }

      // Step 2: Complete signup with profile data
      if (step === 2) {
        // First create the account
        const signupResponse = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        })

        const signupResult = await signupResponse.json()

        if (!signupResponse.ok) {
          if (typeof signupResult.error === 'string') {
            setError(signupResult.error)
          } else {
            setError('Registration failed')
          }
          return
        }

        // Check if email verification is required
        if (signupResult.teacher?.requiresVerification) {
          // Show verification message and redirect to login
          setStep(4) // We'll create a verification step
          return
        }

        // Auto-login the user (for backwards compatibility if verification is disabled)
        const signInResult = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        })

        if (signInResult?.error) {
          setError('Account created successfully! Please check your email to verify your account, then log in manually.')
          return
        }

        // Save booking settings
        const bookingResponse = await fetch('/api/booking-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            settings: {
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
            blockedDates: []
          })
        })

        if (!bookingResponse.ok) {
          console.warn('Failed to save booking settings, but continuing...')
        }

        // Save profile data if provided
        if (profileData.bio || profileData.hourlyRate || profileData.photo) {
          const profileFormData = new FormData()
          if (profileData.bio) profileFormData.append('bio', profileData.bio)
          if (profileData.hourlyRate) profileFormData.append('hourlyRate', profileData.hourlyRate)
          if (profileData.photo) profileFormData.append('photo', profileData.photo)

          const profileResponse = await fetch('/api/profile', {
            method: 'POST',
            body: profileFormData
          })

          if (!profileResponse.ok) {
            console.warn('Failed to save profile data, but continuing...')
          }
        }

        // Redirect to dashboard
        router.push('/admin/dashboard')
      }
    } catch (error) {
      console.error('Signup error:', error)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 py-12 overscroll-none">
      <div className="max-w-2xl w-full mx-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-amber-100 rounded-full mb-4">
              <UserPlusIcon className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {step === 1 ? 'Create Account' : step === 4 ? 'Email Verification' : 'Complete Your Profile'}
            </h1>
            <p className="text-gray-600">
              {step === 1 ? 'Set up your booking page in minutes' : step === 4 ? 'Check your email to verify your account' : 'Just a few more details to get started'}
            </p>
            
            {/* Progress Steps */}
            <div className="flex justify-center items-center mt-6 space-x-3">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                step >= 1 ? 'bg-amber-600 border-amber-600 text-white' : 'border-gray-300 text-gray-300'
              }`}>
                1
              </div>
              <div className={`h-1 w-12 ${step >= 2 ? 'bg-amber-600' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                step >= 2 ? 'bg-amber-600 border-amber-600 text-white' : 'border-gray-300 text-gray-300'
              }`}>
                2
              </div>
              <div className={`h-1 w-12 ${step >= 4 ? 'bg-amber-600' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                step >= 4 ? 'bg-amber-600 border-amber-600 text-white' : 'border-gray-300 text-gray-300'
              }`}>
                3
              </div>
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600 max-w-80 mx-auto">
              <span>Account Details</span>
              <span>Profile Setup</span>
              <span>Email Verification</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <ErrorMessage message={error} className="mb-6" />
          )}

          {/* Step 1: Account Creation */}
          {step === 1 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-gray-900"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-gray-900"
                  placeholder="Enter your email address"
                />
              </div>

              <div>
                <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Booking Page URL
                </label>
                <div className="flex rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-amber-500 focus-within:border-amber-500">
                  <span className="inline-flex items-center px-4 py-3 bg-gray-50 text-gray-500 text-sm rounded-l-lg border-r border-gray-300">
                    workshop.buzz/
                  </span>
                  <input
                    id="subdomain"
                    name="subdomain"
                    type="text"
                    required
                    value={formData.subdomain}
                    onChange={handleInputChange}
                    className="flex-1 px-4 py-3 rounded-r-lg border-0 focus:ring-0 text-gray-900"
                    placeholder="your-name"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">This will be your unique booking page URL</p>
              </div>

              <div className="relative">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-gray-900"
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeClosedIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Requirements - Show when focused */}
                {passwordFocused && formData.password && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-600 mb-2">Password Requirements:</div>
                    <div className="space-y-1">
                      {Object.entries({
                        minLength: 'At least 8 characters',
                        hasUppercase: 'One uppercase letter',
                        hasLowercase: 'One lowercase letter', 
                        hasNumber: 'One number',
                        hasSpecialChar: 'One special character'
                      }).map(([key, text]) => (
                        <div key={key} className="flex items-center text-xs">
                          <div className={`w-3 h-3 rounded-full mr-2 ${
                            passwordValidation.requirements[key as keyof typeof passwordValidation.requirements]
                              ? 'bg-green-500'
                              : 'bg-gray-300'
                          }`} />
                          <span className={passwordValidation.requirements[key as keyof typeof passwordValidation.requirements] ? 'text-green-700' : 'text-gray-600'}>
                            {text}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Password Strength Indicator */}
                    {passwordStrength.level > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-600">Strength:</span>
                          <span className={`text-xs px-2 py-1 rounded ${passwordStrength.color}`}>
                            {passwordStrength.text}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div 
                            className={`h-1 rounded-full transition-all duration-300 ${
                              passwordStrength.level === 1 ? 'bg-red-500 w-1/4' :
                              passwordStrength.level === 2 ? 'bg-yellow-500 w-2/4' :
                              passwordStrength.level === 3 ? 'bg-blue-500 w-3/4' :
                              'bg-green-500 w-full'
                            }`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="relative">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-gray-900"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeClosedIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <SpinnerIcon className="w-5 h-5 mr-2" />
                ) : (
                  <>
                    <span>Next</span>
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: Profile Setup */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Booking Form Settings */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Request Form Fields</h3>
                <p className="text-gray-600 mb-4 text-sm">
                  Select which fields customers must fill out when requesting a booking:
                </p>
                
                <div className="grid gap-3">
                  {Object.entries({
                    name: 'Name',
                    email: 'Email',
                    phone: 'Phone',
                    address: 'Address',
                    dates: 'Date(s) Requested',
                    description: 'Description'
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-900 text-sm">{label}</span>
                        {key === 'name' || key === 'email' ? (
                          <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
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
                        <div className={`w-9 h-5 rounded-full transition-colors ${
                          bookingSettings[key as keyof typeof bookingSettings] 
                            ? 'bg-amber-600' 
                            : 'bg-gray-300'
                        } ${key === 'name' || key === 'email' ? 'opacity-50' : ''}`}>
                          <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                            bookingSettings[key as keyof typeof bookingSettings] 
                              ? 'translate-x-4' 
                              : 'translate-x-0'
                          } mt-0.5 ml-0.5`}></div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Profile Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Profile Information (Optional)</h3>
                
                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Photo
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {photoPreview ? (
                        <Image 
                          src={photoPreview} 
                          alt="Profile preview" 
                          width={64} 
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    <label className="cursor-pointer bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    About You
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    placeholder="Tell students about your experience, teaching style, specialties..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none text-gray-900"
                  />
                </div>

                {/* Hourly Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hourly Rate
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
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center text-gray-600 hover:text-gray-800 font-medium"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center px-6 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <SpinnerIcon className="w-5 h-5 mr-2" />
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Step 4: Email Verification */}
          {step === 4 && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email!</h3>
                <p className="text-gray-600 mb-4">
                  We&apos;ve sent a verification link to <strong>{formData.email}</strong>
                </p>
                <p className="text-sm text-gray-500">
                  Click the link in your email to verify your account, then you can log in.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-center">
                  <svg className="w-5 h-5 text-blue-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm">
                    <p className="text-blue-800 font-medium">Didn&apos;t receive the email?</p>
                    <p className="text-blue-700 mt-1">Check your spam folder or contact support if you need help.</p>
                  </div>
                </div>
              </div>

              <Link
                href="/admin/login"
                className="inline-flex items-center justify-center px-6 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors"
              >
                Go to Login Page
              </Link>
            </div>
          )}

          {/* Login Link */}
          {step !== 4 && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link 
                  href="/admin/login" 
                  className="font-medium text-amber-600 hover:text-amber-500 transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
