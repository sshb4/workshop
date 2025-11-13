'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import CalendarIcon from '@/components/icons/CalendarIcon';
import ProfileIcon from '@/components/icons/ProfileIcon';
import GlobeIcon from '@/components/icons/GlobeIcon';

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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
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
                className="bg-amber-500 text-white px-8 py-4 rounded-lg font-semibold hover:bg-amber-600 transition-colors shadow-lg hover:shadow-xl"
              >
                Get Started Free
              </Link>
              <Link 
                href="/admin/login"
                className="bg-white text-amber-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg border border-amber-200"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="inline-block p-3 bg-amber-100 rounded-full mb-4">
                <CalendarIcon className="w-8 h-8" style={{ filter: 'invert(50%) sepia(80%) saturate(2000%) hue-rotate(10deg) brightness(100%) contrast(100%)' }} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Easy Scheduling</h3>
              <p className="text-gray-600">
                Let clients book appointments directly from your personalized booking page. No back-and-forth emails needed.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="inline-block p-3 bg-yellow-100 rounded-full mb-4">
                <ProfileIcon className="w-8 h-8" style={{ filter: 'invert(60%) sepia(80%) saturate(2000%) hue-rotate(10deg) brightness(100%) contrast(100%)' }} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Professional Branding</h3>
              <p className="text-gray-600">
                Customize your booking page with your photo, bio, rates, and even your own favicon for professional branding.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="inline-block p-3 bg-orange-100 rounded-full mb-4">
                  <GlobeIcon className="w-8 h-8" style={{ filter: 'invert(50%) sepia(80%) saturate(2000%) hue-rotate(10deg) brightness(100%) contrast(100%)' }} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Custom URL</h3>
              <p className="text-gray-600">
                Get your own branded URL like <span className="font-mono text-amber-600">yourname.app.com</span> to share with clients.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <p className="text-gray-500">
              Ready to get started? <Link href="/admin/signup" className="text-amber-600 hover:text-amber-500 font-medium">Create your account</Link> and set up your booking page in under 5 minutes.
            </p>
            <p className="text-gray-500 mt-2">
              Already have an account? <Link href="/admin/login" className="text-amber-600 hover:text-amber-500 font-medium">Sign in to your dashboard</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
