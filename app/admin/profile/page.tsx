// app/admin/profile/page.tsx

import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Suspense } from 'react'
import ProfileForm from './ProfileForm'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return {
      title: 'Profile Settings',
      description: 'Manage your profile information and settings',
    }
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: session.user.id },
    select: { name: true }
  })

  return {
    title: teacher ? `${teacher.name} | Profile` : 'Profile Settings',
    description: 'Manage your profile information and settings',
  }
}

export default async function ProfilePage() {
  // Check if user is logged in
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/admin/login')
  }

  // Get teacher data
  const teacher = await prisma.teacher.findUnique({
    where: { id: session.user.id },
  })

  if (!teacher) {
    redirect('/admin/login')
  }

  // Convert Decimal to number for client component
  const teacherData = {
    ...teacher,
    hourlyRate: teacher.hourlyRate ? Number(teacher.hourlyRate) : null,
    title: (teacher as typeof teacher & { title?: string }).title || null,
    favicon: (teacher as typeof teacher & { favicon?: string }).favicon || null,
    colorScheme: (teacher as typeof teacher & { colorScheme?: string }).colorScheme || 'default'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
         <header className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Link 
                href="/admin/dashboard"
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
                <p className="text-sm text-gray-600">Update your public profile information</p>
              </div>
            </div>
            <Link
              href="/admin/dashboard"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
          <ProfileForm teacher={teacherData} />
        </Suspense>
      </main>
    </div>
  )
}
