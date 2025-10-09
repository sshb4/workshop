// app/teacher/[subdomain]/page.tsx

import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Metadata } from 'next'
import { getColorScheme } from '@/lib/themes'

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

  const teacherTitle = (teacher as { title?: string }).title
  
  return {
    title: teacherTitle ? `${teacher.name} - ${teacherTitle}` : teacher.name,
    description: teacher.bio 
      ? `Book appointments with ${teacher.name}. ${teacher.bio.slice(0, 160)}...`
      : `Book appointments with ${teacher.name}. Professional services available for $${teacher.hourlyRate}/hour.`,
    openGraph: {
      title: teacherTitle ? `${teacher.name} - ${teacherTitle}` : teacher.name,
      description: teacher.bio || `Professional services available for $${teacher.hourlyRate}/hour.`,
      images: teacher.profileImage ? [teacher.profileImage] : [],
      url: `/teacher/${teacher.subdomain}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: teacherTitle ? `${teacher.name} - ${teacherTitle}` : teacher.name,
      description: teacher.bio || `Professional services available for $${teacher.hourlyRate}/hour.`,
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

  // Get the selected color scheme
  const colorScheme = getColorScheme((teacher as typeof teacher & { colorScheme?: string }).colorScheme || 'default')

  return (
    <div 
      className="min-h-screen transition-colors duration-300"
      style={{ 
        background: `linear-gradient(135deg, ${colorScheme.styles.primaryLight}, ${colorScheme.styles.backgroundSecondary})`,
        color: colorScheme.styles.textPrimary,
        '--theme-primary': colorScheme.styles.primary,
        '--theme-primary-hover': colorScheme.styles.primaryHover,
        '--theme-background': colorScheme.styles.background,
        '--theme-text-primary': colorScheme.styles.textPrimary,
        '--theme-border': colorScheme.styles.border,
      } as React.CSSProperties}
    >
      {/* Header */}
      <header 
        className="shadow-sm border-b transition-colors duration-300"
        style={{ 
          backgroundColor: colorScheme.styles.background,
          borderColor: colorScheme.styles.border
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 
            className="text-4xl font-bold transition-colors duration-300"
            style={{ color: colorScheme.styles.textPrimary }}
          >
            {teacher.name}
          </h1>
          {(teacher as { title?: string }).title && (
            <p 
              className="text-lg mt-1 transition-colors duration-300"
              style={{ color: colorScheme.styles.textSecondary }}
            >
              {(teacher as { title?: string }).title}
            </p>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Profile Section */}
        <div 
          className="rounded-2xl shadow-lg p-8 mb-8 transition-colors duration-300"
          style={{ 
            backgroundColor: colorScheme.styles.background,
            borderColor: colorScheme.styles.border,
            border: `1px solid ${colorScheme.styles.border}`
          }}
        >
          <div className="flex flex-col md:flex-row gap-8">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              {teacher.profileImage ? (
                <img
                  src={teacher.profileImage}
                  alt={teacher.name}
                  className="w-40 h-40 rounded-full object-cover border-4 transition-colors duration-300"
                  style={{ borderColor: colorScheme.styles.primaryLight }}
                />
              ) : (
                <div 
                  className="w-40 h-40 rounded-full flex items-center justify-center border-4 transition-colors duration-300"
                  style={{ 
                    background: `linear-gradient(135deg, ${colorScheme.styles.primary}, ${colorScheme.styles.accent})`,
                    borderColor: colorScheme.styles.primaryLight
                  }}
                >
                  <span className="text-6xl font-bold text-white">
                    {teacher.name[0]}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h2 
                className="text-2xl font-semibold mb-4 transition-colors duration-300"
                style={{ color: colorScheme.styles.textPrimary }}
              >
                About Me
              </h2>
              <p 
                className="text-lg leading-relaxed mb-6 transition-colors duration-300"
                style={{ color: colorScheme.styles.textSecondary }}
              >
                {teacher.bio || 'Professional service provider with years of experience helping clients achieve their goals.'}
              </p>
              
              <div 
                className="flex items-baseline gap-3 rounded-lg p-4 inline-block transition-colors duration-300"
                style={{ backgroundColor: colorScheme.styles.primaryLight }}
              >
                <span 
                  className="text-sm font-medium transition-colors duration-300"
                  style={{ color: colorScheme.styles.textSecondary }}
                >
                  Hourly Rate
                </span>
                <p 
                  className="text-3xl font-bold transition-colors duration-300"
                  style={{ color: colorScheme.styles.primary }}
                >
                  ${teacher.hourlyRate.toString()}
                </p>
                <span 
                  className="transition-colors duration-300"
                  style={{ color: colorScheme.styles.textSecondary }}
                >
                  /hour
                </span>
              </div>

              {teacher.phone && (
                <div className="mt-4">
                  <span 
                    className="text-sm transition-colors duration-300"
                    style={{ color: colorScheme.styles.textSecondary }}
                  >
                    Contact: 
                  </span>
                  <span 
                    className="transition-colors duration-300"
                    style={{ color: colorScheme.styles.textPrimary }}
                  >
                    {teacher.phone}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booking Section */}
        <div 
          className="rounded-2xl shadow-lg p-8 transition-colors duration-300"
          style={{ 
            backgroundColor: colorScheme.styles.background,
            borderColor: colorScheme.styles.border,
            border: `1px solid ${colorScheme.styles.border}`
          }}
        >
          <h2 
            className="text-3xl font-bold mb-6 transition-colors duration-300"
            style={{ color: colorScheme.styles.textPrimary }}
          >
            Book a Session
          </h2>
          <p 
            className="mb-8 text-lg transition-colors duration-300"
            style={{ color: colorScheme.styles.textSecondary }}
          >
            Select an available time slot below to schedule your session.
          </p>
          
          {/* Booking Calendar */}
          {teacher.availabilitySlots.length > 0 ? (
            <div className="space-y-6">
              {/* Week View */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {daysOfWeek.map(day => {
                  const daySlots = teacher.availabilitySlots.filter(slot => slot.dayOfWeek === day.id)
                  
                  return (
                    <div 
                      key={day.id} 
                      className="rounded-xl p-4 border transition-colors duration-300"
                      style={{ 
                        background: `linear-gradient(135deg, ${colorScheme.styles.backgroundSecondary}, ${colorScheme.styles.primaryLight})`,
                        borderColor: colorScheme.styles.border
                      }}
                    >
                      <h3 
                        className="font-semibold mb-3 text-center transition-colors duration-300"
                        style={{ color: colorScheme.styles.textPrimary }}
                      >
                        {day.name}
                      </h3>
                      {daySlots.length > 0 ? (
                        <div className="space-y-2">
                          {daySlots.map(slot => (
                            <button
                              key={slot.id}
                              className="w-full rounded-lg px-3 py-3 text-sm transition-all duration-200 group border"
                              style={{ 
                                backgroundColor: colorScheme.styles.background,
                                borderColor: colorScheme.styles.border,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = colorScheme.styles.primaryLight
                                e.currentTarget.style.borderColor = colorScheme.styles.primary
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = colorScheme.styles.background
                                e.currentTarget.style.borderColor = colorScheme.styles.border
                              }}
                            >
                              <div className="text-center">
                                <div 
                                  className="font-medium transition-colors duration-200"
                                  style={{ color: colorScheme.styles.textPrimary }}
                                >
                                  {slot.startTime} - {slot.endTime}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <div 
                            className="mb-2 transition-colors duration-300"
                            style={{ color: colorScheme.styles.textSecondary }}
                          >
                            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                          <p 
                            className="text-xs transition-colors duration-300"
                            style={{ color: colorScheme.styles.textSecondary }}
                          >
                            Not available
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Booking Instructions */}
              <div 
                className="rounded-lg p-4 border transition-colors duration-300"
                style={{ 
                  backgroundColor: colorScheme.styles.primaryLight,
                  borderColor: colorScheme.styles.border
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg 
                      className="w-5 h-5 mt-0.5 transition-colors duration-300" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      style={{ color: colorScheme.styles.primary }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 
                      className="font-medium mb-1 transition-colors duration-300"
                      style={{ color: colorScheme.styles.textPrimary }}
                    >
                      How to Book
                    </h4>
                    <p 
                      className="text-sm transition-colors duration-300"
                      style={{ color: colorScheme.styles.textSecondary }}
                    >
                      Click on any available time slot above to book your session. 
                      You&apos;ll be able to choose your preferred date and provide your contact information.
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div 
                className="text-center pt-4 border-t transition-colors duration-300"
                style={{ borderColor: colorScheme.styles.border }}
              >
                <p 
                  className="mb-2 transition-colors duration-300"
                  style={{ color: colorScheme.styles.textSecondary }}
                >
                  Questions about booking?
                </p>
                {teacher.phone && (
                  <p className="text-sm">
                    <span 
                      className="transition-colors duration-300"
                      style={{ color: colorScheme.styles.textSecondary }}
                    >
                      Call or text: 
                    </span>
                    <a 
                      href={`tel:${teacher.phone}`} 
                      className="font-medium transition-colors duration-200 hover:opacity-80"
                      style={{ color: colorScheme.styles.primary }}
                    >
                      {teacher.phone}
                    </a>
                  </p>
                )}
                <p className="text-sm mt-1">
                  <span 
                    className="transition-colors duration-300"
                    style={{ color: colorScheme.styles.textSecondary }}
                  >
                    Email: 
                  </span>
                  <a 
                    href={`mailto:${teacher.email}`} 
                    className="font-medium transition-colors duration-200 hover:opacity-80"
                    style={{ color: colorScheme.styles.primary }}
                  >
                    {teacher.email}
                  </a>
                </p>
              </div>
            </div>
          ) : (
            <div 
              className="border-2 border-dashed rounded-xl p-16 text-center transition-colors duration-300"
              style={{ 
                borderColor: colorScheme.styles.border,
                backgroundColor: colorScheme.styles.backgroundSecondary
              }}
            >
              <div 
                className="mb-4 transition-colors duration-300"
                style={{ color: colorScheme.styles.textSecondary }}
              >
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p 
                className="text-lg font-medium transition-colors duration-300"
                style={{ color: colorScheme.styles.textSecondary }}
              >
                No availability set
              </p>
              <p 
                className="text-sm mt-2 transition-colors duration-300"
                style={{ color: colorScheme.styles.textSecondary }}
              >
                The provider hasn&apos;t set their available times yet
              </p>
              <p className="text-sm mt-4">
                <span 
                  className="transition-colors duration-300"
                  style={{ color: colorScheme.styles.textSecondary }}
                >
                  Contact directly: 
                </span>
                <a 
                  href={`mailto:${teacher.email}`} 
                  className="font-medium transition-colors duration-200 hover:opacity-80"
                  style={{ color: colorScheme.styles.primary }}
                >
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