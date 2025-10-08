// app/teacher/[subdomain]/page.tsx

import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Metadata } from 'next'

// Generate dynamic metadata for each service provider
export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string }>
}): Promise<Metadata> {
  const { subdomain } = await params
  const teacher = await prisma.teacher.findUnique({
    where: { subdomain },
  })

  if (!teacher) {
    return {
      title: 'Provider Not Found',
    }
  }

  const displayTitle = (teacher as any).title || 'Service Provider'
  
  return {
    title: `${teacher.name} - ${displayTitle}`,
    description: teacher.bio 
      ? `Book appointments with ${teacher.name}. ${teacher.bio.slice(0, 160)}...`
      : `Book appointments with ${teacher.name}. Professional ${displayTitle.toLowerCase()} offering sessions at $${teacher.hourlyRate}/hour.`,
    openGraph: {
      title: `${teacher.name} - ${displayTitle}`,
      description: teacher.bio || `Professional ${displayTitle.toLowerCase()} offering sessions at $${teacher.hourlyRate}/hour.`,
      images: teacher.profileImage ? [teacher.profileImage] : [],
      url: `/teacher/${teacher.subdomain}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${teacher.name} - ${displayTitle}`,
      description: teacher.bio || `Professional ${displayTitle.toLowerCase()} offering sessions at $${teacher.hourlyRate}/hour.`,
      images: teacher.profileImage ? [teacher.profileImage] : [],
    },
  }
}

const daysOfWeek = [
  { id: 0, name: 'Sunday', short: 'Sun' },
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
]

export default async function TeacherProfilePage({
  params,
}: {
  params: Promise<{ subdomain: string }>
}) {
  const { subdomain } = await params
  
  // Fetch teacher by subdomain with availability slots
  const teacher = await prisma.teacher.findUnique({
    where: {
      subdomain,
    },
    include: {
      availabilitySlots: {
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' }
        ]
      },
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
          <p className="text-lg text-gray-600 mt-1">{(teacher as any).title || 'Service Provider'}</p>
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
          
          {/* Booking Calendar */}
          {teacher.availabilitySlots.length > 0 ? (
            <div className="space-y-6">
              {/* Week View */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {daysOfWeek.map(day => {
                  const daySlots = teacher.availabilitySlots.filter(slot => slot.dayOfWeek === day.id)
                  
                  return (
                    <div key={day.id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-3 text-center">{day.name}</h3>
                      {daySlots.length > 0 ? (
                        <div className="space-y-2">
                          {daySlots.map(slot => (
                            <button
                              key={slot.id}
                              className="w-full bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-lg px-3 py-3 text-sm transition-all duration-200 group"
                            >
                              <div className="text-center">
                                <div className="font-medium text-gray-900 group-hover:text-indigo-700">
                                  {slot.startTime} - {slot.endTime}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {slot.durationMinutes} minutes • ${teacher.hourlyRate.toString()}/hour
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <div className="text-gray-400 mb-2">
                            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                          <p className="text-xs text-gray-500">Not available</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Booking Instructions */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">How to Book</h4>
                    <p className="text-sm text-blue-700">
                      Click on any available time slot above to book your dance lesson. 
                      You'll be able to choose your preferred date and provide your contact information.
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-gray-600 mb-2">Questions about booking?</p>
                {teacher.phone && (
                  <p className="text-sm">
                    <span className="text-gray-500">Call or text: </span>
                    <a href={`tel:${teacher.phone}`} className="text-indigo-600 hover:text-indigo-700 font-medium">
                      {teacher.phone}
                    </a>
                  </p>
                )}
                <p className="text-sm mt-1">
                  <span className="text-gray-500">Email: </span>
                  <a href={`mailto:${teacher.email}`} className="text-indigo-600 hover:text-indigo-700 font-medium">
                    {teacher.email}
                  </a>
                </p>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-16 text-center bg-gray-50">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg font-medium">No availability set</p>
              <p className="text-gray-400 text-sm mt-2">The teacher hasn't set their available times yet</p>
              <p className="text-sm mt-4">
                <span className="text-gray-500">Contact directly: </span>
                <a href={`mailto:${teacher.email}`} className="text-indigo-600 hover:text-indigo-700 font-medium">
                  {teacher.email}
                </a>
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 text-center text-gray-500 text-sm">
        <p>Powered by Buzz Financial</p>
      </footer>
    </div>
  )
}