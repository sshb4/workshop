// app/teacher/[subdomain]/page.tsx

import { notFound } from 'next/navigation'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { Metadata } from 'next'
import { getColorScheme } from '@/lib/themes'
import BookingCalendar from './BookingCalendar'

// Type assertion helper to work around Prisma type issues
type SlotLike = Record<string, unknown>

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
  
  // Get favicon from teacher data
  const teacherFavicon = (teacher as { favicon?: string }).favicon

  return {
    title: teacherTitle ? `${teacher.name} - ${teacherTitle}` : teacher.name,
    description: teacher.bio 
      ? `Book appointments with ${teacher.name}. ${teacher.bio.slice(0, 160)}...`
      : `Book appointments with ${teacher.name}. Professional services available for $${teacher.hourlyRate}/hour.`,
    icons: teacherFavicon ? {
      icon: teacherFavicon,
      shortcut: teacherFavicon,
    } : undefined,
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



export default async function TeacherProfilePage({
  params,
}: {
  params: Promise<{ subdomain: string }>
}) {
  const { subdomain } = await params
  
  // Fetch teacher by subdomain (without includes to isolate the issue)
  let teacher
  try {
    teacher = await prisma.teacher.findUnique({
      where: {
        subdomain,
      }
    })
  } catch (error) {
    console.error('Error fetching teacher:', error)
    notFound()
  }

  // Fetch availability slots separately
  let availabilitySlots: SlotLike[] = []
  if (teacher) {
    try {
      availabilitySlots = await prisma.availabilitySlot.findMany({
        where: {
          teacherId: teacher.id
        },
        orderBy: [
          { createdAt: 'asc' }
        ]
      })
    } catch (error) {
      console.error('Error fetching availability slots:', error)
      // Continue without availability slots
    }
  }

  // If teacher doesn't exist, show 404
  if (!teacher) {
    notFound()
  }

  // Map and filter availability slots to match expected interface
  const mappedSlots = availabilitySlots
    .filter((slot: SlotLike) => !('isActive' in slot) || slot.isActive !== false)
    .map((slot: SlotLike) => ({
      id: String(slot.id || ''),
      title: (slot.title as string) || null,
      startDate: slot.startDate ? String(slot.startDate) : new Date().toISOString(),
      endDate: slot.endDate ? String(slot.endDate) : null,
      dayOfWeek: Number(slot.dayOfWeek || 0),
      startTime: String(slot.startTime || '09:00'),
      endTime: String(slot.endTime || '17:00'),
      isActive: Boolean(slot.isActive !== false)
    }))

  // Create a teacher object with mapped slots
  const teacherWithActiveSlots = {
    ...teacher,
    availabilitySlots: mappedSlots
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
                <Image
                  src={teacher.profileImage}
                  alt={teacher.name}
                  width={160}
                  height={160}
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
              {teacher.bio && (
                <p 
                  className="text-lg leading-relaxed mb-6 transition-colors duration-300"
                  style={{ color: colorScheme.styles.textSecondary }}
                >
                  {teacher.bio}
                </p>
              )}
              
              {teacher.hourlyRate && (
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
              )}

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
            Select an available time window below to schedule your session.
          </p>
          
          {/* Booking Calendar */}
          {teacherWithActiveSlots.availabilitySlots.length > 0 ? (
            <BookingCalendar 
              teacher={{
                id: teacher.id,
                subdomain: teacher.subdomain,
                name: teacher.name,
                hourlyRate: teacher.hourlyRate ? Number(teacher.hourlyRate) : undefined,
                title: (teacher as { title?: string }).title
              }}
              availabilitySlots={teacherWithActiveSlots.availabilitySlots}
              colorScheme={colorScheme}
            />
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