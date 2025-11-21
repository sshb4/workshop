// app/admin/profile/ProfileForm.tsx

'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { colorSchemes } from '@/lib/themes'
import { SuccessCheckIcon } from '@/components/icons/SuccessCheckIcon'

interface Teacher {
  id: string
  name: string
  email: string
  phone: string | null
  hourlyRate: number | null
  subdomain: string
  title: string | null
  bio: string | null
  profileImage: string | null
  favicon: string | null
  colorScheme: string
  timeFormat?: string | null
  hasMerchPage?: boolean
}

interface ProfileFormProps {
  teacher: Teacher
}

export default function ProfileForm({ teacher }: ProfileFormProps) {
  const searchParams = useSearchParams()
  const [showSuccess, setShowSuccess] = useState(false)
  const [origin, setOrigin] = useState('your-domain.com')
  const [phoneValue, setPhoneValue] = useState(teacher.phone || '')
  const [form, setForm] = useState({
  teacherId: teacher.id,
  name: teacher.name,
  email: teacher.email,
  phone: teacher.phone,
  hourlyRate: teacher.hourlyRate,
  subdomain: teacher.subdomain,
  title: teacher.title,
  bio: teacher.bio,
  profileImage: teacher.profileImage,
  favicon: teacher.favicon,
  colorScheme: teacher.colorScheme,
  //hasMerchPage: false, // new state for merch page toggle
  checkoutType: 'invoice'
  })

  // Phone number formatting function
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const phoneNumber = value.replace(/\D/g, '')
    
    // Format based on length
    if (phoneNumber.length <= 3) {
      return phoneNumber
    } else if (phoneNumber.length <= 6) {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`
    } else if (phoneNumber.length <= 10) {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`
    } else {
      // For numbers longer than 10 digits, format as +1-XXX-XXX-XXXX
      return `+${phoneNumber.slice(0, 1)}-${phoneNumber.slice(1, 4)}-${phoneNumber.slice(4, 7)}-${phoneNumber.slice(7, 11)}`
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhoneValue(formatted)
  }

  useEffect(() => {
    if (searchParams.get('updated') === 'true') {
      setShowSuccess(true)
      // Hide success message after 5 seconds
      const timer = setTimeout(() => setShowSuccess(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  useEffect(() => {
    // Set origin on client side to avoid hydration mismatch
    setOrigin(window.location.origin)
    
    // Format existing phone number on load
    if (teacher.phone) {
      setPhoneValue(formatPhoneNumber(teacher.phone))
    }
  }, [teacher.phone])

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      hasMerchPage: teacher.hasMerchPage || false
    }));
  }, [teacher.hasMerchPage]);

  return (
    <>
      {/* Success Message */}
      {showSuccess && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
                <SuccessCheckIcon className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                Your profile has been updated successfully!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
          <p className="text-sm text-gray-600">This information will be displayed on your public booking page</p>
        </div>

        <form className="p-6 space-y-6" action="/api/profile" method="POST">
          <input type="hidden" name="teacherId" value={teacher.id} />
          
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={teacher.name}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition font-medium"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={teacher.email}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition font-medium"
                placeholder="your@email.com"
              />
            </div>
          </div>

          {/* Professional Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Professional Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              defaultValue={teacher.title || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition font-medium"
              placeholder="e.g. Fitness Coach, Business Consultant, Piano Teacher, Massage Therapist"
            />
            <p className="mt-1 text-sm text-gray-500">
              This will be displayed on your public profile (e.g., &quot;John Smith - Fitness Coach&quot;). Optional field.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={phoneValue}
                onChange={handlePhoneChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition font-medium"
                placeholder="555-123-4567"
                maxLength={14}
              />
              <p className="mt-1 text-sm text-gray-500">
                Phone number will be automatically formatted as you type.
              </p>
            </div>

            <div>
              <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-2">
                Hourly Rate ($)
              </label>
              <input
                id="hourlyRate"
                name="hourlyRate"
                type="number"
                step="0.01"
                min="0"
                defaultValue={teacher.hourlyRate ? teacher.hourlyRate.toString() : ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition font-medium"
                placeholder="50.00"
              />
              <p className="mt-1 text-sm text-gray-500">
                Leave blank if you prefer not to display pricing on your public page.
              </p>
            </div>
          </div>

          {/* Subdomain */}
          <div>
            <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700 mb-2">
              Booking Page URL
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                {origin}/
              </span>
              <input
                id="subdomain"
                name="subdomain"
                type="text"
                defaultValue={teacher.subdomain}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition font-medium"
                placeholder="maria"
                pattern="[a-z0-9-]+"
                title="Only lowercase letters, numbers, and hyphens allowed"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              This will be your public booking page URL. Only lowercase letters, numbers, and hyphens allowed.
            </p>
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
              About You
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              defaultValue={teacher.bio || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
              placeholder="Tell potential students about your experience, teaching style, and what makes you unique..."
            />
            <p className="mt-1 text-sm text-gray-500">
              This will be displayed on your public profile to help students learn about you.
            </p>
          </div>

          {/* Color Scheme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Page Theme
            </label>
            <p className="text-sm text-gray-500 mb-4">
              Choose a color theme for your booking page. This affects the colors and overall look of your public profile.
            </p>
            {/* Theme Preview */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Array.isArray(colorSchemes) && colorSchemes.map(scheme => (
                <div key={scheme.id} className="relative">
                  <input
                    type="radio"
                    id={`theme-${scheme.id}`}
                    name="colorScheme"
                    value={scheme.id}
                    defaultChecked={teacher.colorScheme === scheme.id}
                    className="sr-only peer"
                  />
                  <label
                    htmlFor={`theme-${scheme.id}`}
                    className="block cursor-pointer rounded-lg border-2 border-gray-200 p-3 hover:border-gray-300 peer-checked:border-indigo-500 peer-checked:ring-2 peer-checked:ring-indigo-500 transition"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: scheme.preview.primary }}
                      />
                      <div 
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: scheme.preview.secondary }}
                      />
                      <div 
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: scheme.preview.background }}
                      />
                    </div>
                    <div className="text-xs font-medium text-gray-700">{scheme.name}</div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Profile Image Upload */}
          <div className="mb-6">
            <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700 mb-2">
              Profile Image
            </label>
            <div className="flex flex-col w-full gap-2">
              <input
                id="profileImage"
                name="photo"
                type="file"
                accept="image/*"
                className="w-full block border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition font-medium"
              />
              <p className="text-sm text-gray-500">
                Upload a profile photo. Leave blank to use your initials as a placeholder.
              </p>
            </div>
          </div>

          {/* Favicon Upload */}
          <div className="mb-6">
            <label htmlFor="favicon" className="block text-sm font-medium text-gray-700 mb-2">
              Custom Favicon
            </label>
            <div className="flex flex-col w-full gap-2">
              <input
                id="favicon"
                name="faviconFile"
                type="file"
                accept="image/png,image/x-icon,image/svg+xml"
                className="w-full block border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition font-medium"
              />
              <p className="text-sm text-gray-500">
                Upload a favicon (recommended: 32x32 PNG, SVG, or ICO). Leave blank to use the default favicon.
              </p>
            </div>
          </div>

          {/* Merch Page Option 
          <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Include Merch Page</h3>
            <p className="text-gray-600 mb-4 text-sm">Enable a public merch page to sell products or resources.</p>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="hasMerchPage"
                checked={form.hasMerchPage || false}
                value="true"
                onChange={e => setForm(prev => ({ ...prev, hasMerchPage: e.target.checked }))}
                className="w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
              />
              <span className="text-sm text-gray-900">Enable Merch Page</span>
            </label>
          </div>
          */}
            {/* Checkout Type Option */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Checkout Type</h3>
              <p className="text-gray-600 mb-4 text-sm">Choose how customers pay for merch: Invoice or Checkout.</p>
              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="checkoutType"
                    value="invoice"
                    checked={form.checkoutType === 'invoice'}
                    onChange={e => setForm(prev => ({ ...prev, checkoutType: e.target.value }))}
                    className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-900">Invoice</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="checkoutType"
                    value="checkout"
                    checked={form.checkoutType === 'checkout'}
                    onChange={e => setForm(prev => ({ ...prev, checkoutType: e.target.value }))}
                    className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-900">Checkout</span>
                </label>
              </div>
            </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition duration-200 shadow-sm hover:shadow-md"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900">Preview Your Page</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">See how your profile looks to potential students</p>
          <Link
            href={`/${teacher.subdomain}`}
            target="_blank"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View Public Page
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900">Change Password</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">Update your login password for security</p>
          <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
            Coming Soon →
          </button>
        </div>
      </div>
    </>
  )
}
