// app/_sites/[subdomain]/page.tsx

import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function TeacherProfilePage({
  params,
}: {
  params: { subdomain: string }
}) {
  // Fetch teacher by subdomain
  const teacher = await prisma.teacher.findUnique({
    where: {
      subdomain: params.subdomain,
    },
  })

  // If teacher doesn't exist, show 404
  if (!teacher) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-4xl font-bold text-gray-900">{teacher.name}</h1>
          <p className="text-lg text-gray-600 mt-1">Dance Instructor</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Profile Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              {teacher.profileImage ? (
                <img
                  src={teacher.profileImage}
                  alt={teacher.name}
                  className="w-40 h-40 rounded-full object-cover border-4 border-indigo-100"
                />
              ) : (
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center border-4 border-indigo-100">
                  <span className="text-6xl font-bold text-white">
                    {teacher.name[0]}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">About Me</h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                {teacher.bio || 'Professional dance instructor with years of experience teaching students of all levels.'}
              </p>
              
              <div className="flex items-baseline gap-3 bg-indigo-50 rounded-lg p-4 inline-block">
                <span className="text-sm text-gray-600 font-medium">Hourly Rate</span>
                <p className="text-3xl font-bold text-indigo-600">
                  ${teacher.hourlyRate.toString()}
                </p>
                <span className="text-gray-500">/hour</span>
              </div>

              {teacher.phone && (
                <div className="mt-4">
                  <span className="text-sm text-gray-600">Contact: </span>
                  <span className="text-gray-900">{teacher.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booking Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">Book a Lesson</h2>
          <p className="text-gray-600 mb-8 text-lg">
            Select an available time slot below to schedule your dance lesson.
          </p>
          
          {/* Placeholder for booking calendar */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-16 text-center bg-gray-50">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg font-medium">Booking calendar coming soon...</p>
            <p className="text-gray-400 text-sm mt-2">The teacher needs to set their availability first</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 text-center text-gray-500 text-sm">
        <p>Powered by DanceBooking Platform</p>
      </footer>
    </div>
  )
}