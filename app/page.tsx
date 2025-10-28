'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // Ensure client-side hydration is complete
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Only redirect after component is mounted and user is authenticated
    if (mounted && status === 'authenticated' && session?.user) {
      router.push('/admin/dashboard')
    }
  }, [mounted, status, session, router])

  // Show landing page by default, redirect happens client-side
  return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <div className="mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Professional Booking Platform
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Create your personalized booking page in minutes. Share your unique URL and let clients book appointments with ease.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/admin/signup"
                className="bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Get Started Free
              </Link>
              <Link 
                href="/admin/login"
                className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg border border-indigo-200"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="inline-block p-3 bg-indigo-100 rounded-full mb-4">
                <img src="/calendar (1).svg" alt="Easy Scheduling" className="w-8 h-8" style={{ filter: 'invert(40%) sepia(80%) saturate(2000%) hue-rotate(190deg) brightness(100%) contrast(100%)' }} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Easy Scheduling</h3>
              <p className="text-gray-600">
                Let clients book appointments directly from your personalized booking page. No back-and-forth emails needed.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="inline-block p-3 bg-purple-100 rounded-full mb-4">
                <img src="/profile-circle (1).svg" alt="Professional Branding" className="w-8 h-8" style={{ filter: 'invert(30%) sepia(80%) saturate(2000%) hue-rotate(270deg) brightness(100%) contrast(100%)' }} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Professional Branding</h3>
              <p className="text-gray-600">
                Customize your booking page with your photo, bio, rates, and even your own favicon for professional branding.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="inline-block p-3 bg-pink-100 rounded-full mb-4">
                  <img src="/globe.svg" alt="Custom URL" className="w-8 h-8" style={{ filter: 'invert(40%) sepia(80%) saturate(2000%) hue-rotate(320deg) brightness(100%) contrast(100%)' }} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Custom URL</h3>
              <p className="text-gray-600">
                Get your own branded URL like <span className="font-mono text-indigo-600">yourname.app.com</span> to share with clients.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <p className="text-gray-500">
              Ready to get started? <Link href="/admin/signup" className="text-indigo-600 hover:text-indigo-500 font-medium">Create your account</Link> and set up your booking page in under 5 minutes.
            </p>
            <p className="text-gray-500 mt-2">
              Already have an account? <Link href="/admin/login" className="text-indigo-600 hover:text-indigo-500 font-medium">Sign in to your dashboard</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
