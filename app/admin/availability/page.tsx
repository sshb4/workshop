// app/admin/availability/page.tsx

import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

const daysOfWeek = [
  { id: 0, name: 'Sunday', short: 'Sun' },
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
]

const timeSlots = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', 
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', 
  '18:00', '19:00', '20:00', '21:00', '22:00'
]

export default async function AvailabilityPage() {
  // Check if user is logged in
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/admin/login')
  }

  // Get teacher data with availability slots
  const teacher = await prisma.teacher.findUnique({
    where: { id: session.user.id },
    include: {
      availabilitySlots: {
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' }
        ]
      },
    },
  })

  if (!teacher) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
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
                <h1 className="text-2xl font-bold text-gray-900">Manage Availability</h1>
                <p className="text-sm text-gray-600">Set your weekly schedule for dance lessons</p>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Current Availability Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Current Schedule</h2>
            <p className="text-sm text-gray-600">Your available time slots throughout the week</p>
          </div>
          <div className="p-6">
            {teacher.availabilitySlots.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {daysOfWeek.map(day => {
                  const daySlots = teacher.availabilitySlots.filter(slot => slot.dayOfWeek === day.id)
                  
                  return (
                    <div key={day.id} className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">{day.name}</h3>
                      {daySlots.length > 0 ? (
                        <div className="space-y-2">
                          {daySlots.map(slot => (
                            <div key={slot.id} className="flex items-center justify-between text-sm bg-white rounded px-3 py-2">
                              <span className="text-gray-700">
                                {slot.startTime} - {slot.endTime}
                              </span>
                              <span className="text-xs text-gray-500">
                                {slot.durationMinutes}min
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Not available</p>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No availability set</h3>
                <p className="text-gray-600 mb-4">Set your weekly schedule to start accepting bookings</p>
              </div>
            )}
          </div>
        </div>

        {/* Add New Availability */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Add Time Slot</h2>
            <p className="text-sm text-gray-600">Create a new available time slot for bookings</p>
          </div>
          <div className="p-6">
            <form className="space-y-6" action="/api/availability" method="POST">
              <input type="hidden" name="teacherId" value={teacher.id} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Day of Week */}
                <div>
                  <label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700 mb-2">
                    Day of Week
                  </label>
                  <select
                    id="dayOfWeek"
                    name="dayOfWeek"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  >
                    <option value="">Select day</option>
                    {daysOfWeek.map(day => (
                      <option key={day.id} value={day.id}>{day.name}</option>
                    ))}
                  </select>
                </div>

                {/* Start Time */}
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <select
                    id="startTime"
                    name="startTime"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  >
                    <option value="">Select time</option>
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                {/* End Time */}
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <select
                    id="endTime"
                    name="endTime"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  >
                    <option value="">Select time</option>
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label htmlFor="durationMinutes" className="block text-sm font-medium text-gray-700 mb-2">
                    Lesson Duration
                  </label>
                  <select
                    id="durationMinutes"
                    name="durationMinutes"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  >
                    <option value="">Select duration</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition duration-200 shadow-sm hover:shadow-md"
                >
                  Add Time Slot
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900">Weekly Template</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Set the same hours for multiple days at once</p>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Coming Soon →
            </button>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900">Block Time</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Temporarily block time slots for holidays or breaks</p>
            <button className="text-sm text-green-600 hover:text-green-700 font-medium">
              Coming Soon →
            </button>
          </div>

        </div>
      </main>
    </div>
  )
}
