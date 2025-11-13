// app/admin/login/page.tsx

'use client'

import { signIn } from 'next-auth/react'
import { useState, FormEvent, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import EyeIcon from '@/components/icons/EyeIcon';
import EyeClosedIcon from '@/components/icons/EyeClosedIcon';
import UserIcon from '@/components/icons/UserIcon';
import CheckCircleIcon from '@/components/icons/GraphUpIcon';
import TimesCircleIcon from '@/components/icons/TimesCircleIcon';
import SpinnerIcon from '@/components/icons/SpinnerIcon';

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showEmailVerification, setShowEmailVerification] = useState(false)
  const [resendingEmail, setResendingEmail] = useState(false)

  useEffect(() => {
    const message = searchParams.get('message')
    const verified = searchParams.get('verified')
    
    if (verified === 'true') {
      setSuccessMessage('Email verified successfully! You can now log in.')
    } else if (message) {
      setSuccessMessage(message)
    }
  }, [searchParams])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setShowEmailVerification(false)
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        if (result.error.includes('verify your email')) {
          setShowEmailVerification(true)
          setError('Please verify your email address before logging in.')
        } else {
          setError('Invalid email or password')
        }
      } else {
        router.push('/admin/dashboard')
        router.refresh()
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleResendVerification() {
    if (!email) {
      setError('Please enter your email address first')
      return
    }

    setResendingEmail(true)
    setError('')

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccessMessage('Verification email sent! Please check your inbox.')
        setShowEmailVerification(false)
      } else {
        setError(data.error || 'Failed to send verification email')
      }
    } catch {
      setError('Failed to send verification email')
    } finally {
      setResendingEmail(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 overscroll-none">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-amber-100 rounded-full mb-4">
              <UserIcon className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Teacher Login</h2>
            <p className="mt-2 text-gray-600">Sign in to manage your bookings</p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <TimesCircleIcon className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Email Verification Resend */}
          {showEmailVerification && (
            <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <div className="flex items-center justify-between">
                <div className="flex ml-3">
                  <p className="text-sm text-blue-700">
                    Didn&apos;t receive the verification email?
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendingEmail}
                  className="text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 px-3 py-1 rounded-md transition-colors disabled:opacity-50"
                >
                  {resendingEmail ? 'Sending...' : 'Resend Email'}
                </button>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition font-medium"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition font-medium"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? (
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
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Forgot Password Link */}
          <div className="mt-4 text-center">
            <Link 
              href="/admin/forgot-password" 
              className="text-sm text-gray-600 hover:text-amber-600 transition-colors"
            >
              Forgot your password?
            </Link>
          </div>

          {/* Signup Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link 
                href="/admin/signup" 
                className="font-medium text-amber-600 hover:text-amber-500 transition-colors"
              >
                Create one here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center">
              <div className="inline-block p-3 bg-amber-100 rounded-full mb-4">
                <SpinnerIcon className="w-8 h-8 text-amber-600 animate-spin" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Loading...</h2>
            </div>
          </div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}