import ClockIcon from '@/components/icons/ClockIcon';
import SettingsIcon from '@/components/icons/SettingsIcon';
import ProfileIcon from '@/components/icons/ProfileIcon';
import CalendarIcon from '@/components/icons/CalendarIcon';
import DollarIcon from '@/components/icons/DollarIcon';
import GraphUpIcon from '@/components/icons/GraphUpIcon';
// app/admin/dashboard/page.tsx

import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import SignOutModal from '../../../components/SignOutModal'
import { Metadata } from 'next'

// Force this page to be rendered dynamically because it depends on per-request
// server data (session/headers). This prevents Next.js from attempting to
// prerender it statically and avoids the DYNAMIC_SERVER_USAGE error.
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return {
      title: 'Provider Dashboard',
      description: 'Manage your appointments, availability, and profile',
    }
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: session.user.id },
    select: { name: true }
  })

  return {
    title: teacher ? `${teacher.name} | Dashboard` : 'Provider Dashboard',
    description: 'Manage your appointments, availability, and profile',
  }
}

type BookingWithDetails = {
  id: string
  studentName: string
  studentEmail: string
  bookingDate: Date
  startTime: string
  endTime: string
  amountPaid: number
  paymentStatus: string
  notes: string | null
}

export default async function DashboardPage() {
  // Check if user is logged in
  let session
  try {
    session = await getServerSession(authOptions)
  } catch (error) {
    console.error('Session error:', error)
    redirect('/admin/login')
  }
  
  if (!session?.user?.id) {
    redirect('/admin/login')
  }

  // Get teacher data
  const teacher = await prisma.teacher.findUnique({
    where: { id: session.user.id },
    include: {
      bookings: {
        orderBy: [
          { createdAt: 'desc' }, // Show newest first (including requests)
          { bookingDate: 'asc' }
        ],
        take: 10,
      },
    },
  })


  if (!teacher) {
    redirect('/admin/login')
  }

  // Calculate stats
  const totalBookings = await prisma.booking.count({
    where: { teacherId: teacher.id },
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0) // Start of today
  
  const upcomingBookings = await prisma.booking.count({
    where: {
      teacherId: teacher.id,
      bookingDate: { gte: today },
    },
  })

  const pendingRequests = await prisma.booking.count({
    where: {
      teacherId: teacher.id,
      paymentStatus: 'request',
    },
  })

  const totalRevenue = await prisma.booking.aggregate({
    where: {
      teacherId: teacher.id,
      paymentStatus: 'paid',
    },
    _sum: { amountPaid: true },
  })

  const thisMonthRevenue = await prisma.booking.aggregate({
    where: {
      teacherId: teacher.id,
      paymentStatus: 'paid',
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    },
    _sum: { amountPaid: true },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'request': return 'bg-orange-100 text-orange-800'
      case 'quote-sent': return 'bg-blue-100 text-blue-800'
      case 'partial': return 'bg-purple-100 text-purple-800'
      case 'refunded': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
  <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
  <header className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600 hidden sm:block">Welcome back, {teacher.name}!</p>
              <p className="text-xs sm:text-sm text-gray-600 sm:hidden">{teacher.name}</p>
            </div>
            <div className="flex gap-2 sm:gap-4">
              <Link
                href={`/${teacher.subdomain}`}
                target="_blank"
                className="inline-flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span className="hidden sm:inline">View My Page</span>
                <span className="sm:hidden">View</span>
              </Link>
              {/* Sign Out Modal Popup */}
              <SignOutModal />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Quick Actions - Moved Above Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Link
            href="/admin/availability"
            className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:border-indigo-300 hover:shadow-md transition group"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition">
                <ClockIcon className="w-5 h-5 sm:w-6 sm:h-6" style={{ filter: 'invert(24%) sepia(94%) saturate(7470%) hue-rotate(220deg) brightness(95%) contrast(101%)' }} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Set Availability</h3>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Manage your schedule</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/booking-settings"
            className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:border-orange-300 hover:shadow-md transition group"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition">
                  <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6" style={{ filter: 'invert(60%) sepia(80%) saturate(2000%) hue-rotate(20deg) brightness(100%) contrast(100%)' }} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Booking Settings</h3>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Customize booking rules</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/profile"
            className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:border-purple-300 hover:shadow-md transition group"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition">
                <ProfileIcon className="w-5 h-5 sm:w-6 sm:h-6" style={{ filter: 'invert(30%) sepia(80%) saturate(2000%) hue-rotate(270deg) brightness(100%) contrast(100%)' }} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Edit Profile</h3>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Update your info</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/manage-bookings"
            className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:border-blue-300 hover:shadow-md transition group"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition">
                <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" style={{ filter: 'invert(40%) sepia(80%) saturate(2000%) hue-rotate(190deg) brightness(100%) contrast(100%)' }} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Bookings</h3>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Manage & add bookings</p>
              </div>
            </div>
          </Link>

        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {/* Total Bookings */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{totalBookings}</p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                <CalendarIcon className="w-4 h-4 sm:w-6 sm:h-6" style={{ filter: 'invert(40%) sepia(80%) saturate(2000%) hue-rotate(190deg) brightness(100%) contrast(100%)' }} />
              </div>
            </div>
          </div>

          {/* Upcoming */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{upcomingBookings}</p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                <ClockIcon className="w-4 h-4 sm:w-6 sm:h-6" style={{ filter: 'invert(24%) sepia(94%) saturate(7470%) hue-rotate(220deg) brightness(95%) contrast(101%)' }} />
              </div>
            </div>
          </div>

          {/* This Month Revenue */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">This Month</p>
                <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">
                  ${thisMonthRevenue._sum.amountPaid?.toFixed(0) || '0'}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
                <DollarIcon className="w-4 h-4 sm:w-6 sm:h-6" style={{ filter: 'invert(30%) sepia(80%) saturate(2000%) hue-rotate(270deg) brightness(100%) contrast(100%)' }} />
              </div>
            </div>
          </div>

          {/* Pending Requests */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Pending Requests</p>
                <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{pendingRequests}</p>
              </div>
              <div className="p-2 sm:p-3 bg-orange-100 rounded-lg">
                  <GraphUpIcon className="w-4 h-4 sm:w-6 sm:h-6" style={{ filter: 'invert(50%) sepia(80%) saturate(2000%) hue-rotate(15deg) brightness(100%) contrast(100%)' }} />
              </div>
            </div>
          </div>
        </div>


        {/* Recent Bookings Calendar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Schedule</h2>
          </div>
          <div className="p-6">
            {teacher.bookings.length > 0 ? (
              <div className="space-y-6">
                {/* Calendar Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teacher.bookings
                    .filter((booking: BookingWithDetails) => booking.paymentStatus !== 'request' || booking.paymentStatus === 'request')
                    .map((booking: BookingWithDetails) => (
                    <div
                      key={booking.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        booking.paymentStatus === 'request' 
                          ? 'bg-orange-50 border-l-orange-400' 
                          : booking.paymentStatus === 'paid'
                          ? 'bg-green-50 border-l-green-400'
                          : 'bg-yellow-50 border-l-yellow-400'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{booking.studentName}</p>
                          <p className="text-xs text-gray-600 truncate">{booking.studentEmail}</p>
                        </div>
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.paymentStatus)}`}
                        >
                          {booking.paymentStatus === 'request' ? 'Request' : booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                        </span>
                      </div>
                      
                      {booking.paymentStatus === 'request' ? (
                        <div>
                          <p className="text-sm text-orange-700 font-medium">Booking Request</p>
                          <p className="text-xs text-orange-600">
                            Submitted {new Date(booking.bookingDate).toLocaleDateString()}
                          </p>
                          {booking.notes && booking.notes.includes('Preferred Dates:') && (
                            <p className="text-xs text-orange-600 mt-1">
                              {booking.notes.split('\n')[0]}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {new Date(booking.bookingDate).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                          <p className="text-xs text-gray-600">
                            {booking.startTime} - {booking.endTime}
                          </p>
                          <p className="text-xs font-medium text-gray-900 mt-1">
                            ${booking.amountPaid.toString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg
                  className="w-16 h-16 text-gray-300 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                <p className="text-gray-600 mb-4">Share your booking page to get started!</p>
                <Link
                  href={`/${teacher.subdomain}`}
                  target="_blank"
                  className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  View My Booking Page
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
      <footer className="w-full py-2 bg-white border-t mt-auto text-center text-sm text-gray-500">
        Powered by Buzz Financial
      </footer>
    </div>
  )
}