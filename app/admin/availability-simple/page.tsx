'use client'

import { useSession } from 'next-auth/react'

export default function SimpleAvailabilityPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div className="p-8">Loading...</div>
  }

  if (status === 'unauthenticated') {
    return (
      <div className="p-8">
        <h1>Please log in</h1>
        <a href="/admin/login" className="text-blue-600">Go to login</a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Availability Management - Simple Version</h1>
        <p className="text-gray-600 mb-4">This is a simplified version to test routing.</p>
        <a 
          href="/admin/dashboard" 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  )
}
