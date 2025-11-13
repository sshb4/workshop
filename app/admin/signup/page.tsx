// app/admin/signup/page.tsx

'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ErrorMessage from '@/components/ErrorMessage'
import EyeIcon from '@/components/icons/EyeIcon';
import EyeClosedIcon from '@/components/icons/EyeClosedIcon';
import UserPlusIcon from '@/components/icons/UserPlusIcon'

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    subdomain: ''
  })
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

    // Basic validation
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

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        if (typeof result.error === 'string') {
          setError(result.error)
        } else {
          console.log('Unexpected error value from signup API:', result.error)
          setError('Registration failed')
        }
        return
      }

      // Registration successful - redirect to login
      router.push('/admin/login?message=Registration successful! Please log in.')
    } catch (error) {
      console.error('Registration error:', error)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 py-12 overscroll-none">
      <div className="max-w-md w-full mx-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-amber-100 rounded-full mb-4">
              <UserPlusIcon className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600">Set up your booking page in minutes</p>
          </div>

          {/* Error Message */}
          {error && (
            <ErrorMessage message={error} className="mb-6" />
          )}

          {/* Signup Form */}
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
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700 mb-1">
                Booking Page URL
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  /
                </span>
                <input
                  id="subdomain"
                  name="subdomain"
                  type="text"
                  required
                  value={formData.subdomain}
                  onChange={handleInputChange}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-gray-900"
                  placeholder="your-name"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Choose a unique URL for your booking page (lowercase letters, numbers, and hyphens only)
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-gray-900"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeIcon className="w-5 h-5" />
                  ) : (
                    <EyeClosedIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              
              {/* Password Strength Meter */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">Password Strength</span>
                    {passwordStrength.level > 0 && (
                      <span className={`text-xs px-2 py-1 rounded-full ${passwordStrength.color}`}>
                        {passwordStrength.text}
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.level === 1 ? 'bg-red-500 w-1/4' :
                        passwordStrength.level === 2 ? 'bg-yellow-500 w-2/4' :
                        passwordStrength.level === 3 ? 'bg-blue-500 w-3/4' :
                        passwordStrength.level === 4 ? 'bg-green-500 w-full' : 'w-0'
                      }`}
                    ></div>
                  </div>
                </div>
              )}
              
              {/* Password Requirements */}
              {(passwordFocused || formData.password) && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
                  <ul className="space-y-1 text-xs">
                    <li className={`flex items-center ${passwordValidation.requirements.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                      <svg className={`w-3 h-3 mr-2 ${passwordValidation.requirements.minLength ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      At least 8 characters
                    </li>
                    <li className={`flex items-center ${passwordValidation.requirements.hasUppercase ? 'text-green-600' : 'text-gray-500'}`}>
                      <svg className={`w-3 h-3 mr-2 ${passwordValidation.requirements.hasUppercase ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      One uppercase letter (A-Z)
                    </li>
                    <li className={`flex items-center ${passwordValidation.requirements.hasLowercase ? 'text-green-600' : 'text-gray-500'}`}>
                      <svg className={`w-3 h-3 mr-2 ${passwordValidation.requirements.hasLowercase ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      One lowercase letter (a-z)
                    </li>
                    <li className={`flex items-center ${passwordValidation.requirements.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                      <svg className={`w-3 h-3 mr-2 ${passwordValidation.requirements.hasNumber ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      One number (0-9)
                    </li>
                    <li className={`flex items-center ${passwordValidation.requirements.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}`}>
                      <svg className={`w-3 h-3 mr-2 ${passwordValidation.requirements.hasSpecialChar ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      One special character
                    </li>
                  </ul>
                  {passwordValidation.isValid && (
                    <p className="mt-2 text-sm text-green-600 font-medium">✓ Password meets all requirements</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
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
                  {showConfirmPassword ? (
                    <EyeIcon className="w-5 h-5" />
                  ) : (
                    <EyeClosedIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-amber-600 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
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
        </div>
      </div>
    </div>
  )
}
