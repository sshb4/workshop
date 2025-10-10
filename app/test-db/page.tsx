import { prisma } from '@/lib/prisma'

export default async function TestPage() {
  const teachers = await prisma.teacher.findMany()
  
  const bookings = await prisma.booking.findMany({
    include: {
      teacher: {
        select: { name: true, subdomain: true }
      }
    }
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const upcomingBookings = bookings.filter(booking => booking.bookingDate >= today)
  
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Database Test</h1>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Teachers:</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm">
          {JSON.stringify(teachers, null, 2)}
        </pre>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">All Bookings ({bookings.length}):</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm">
          {JSON.stringify(bookings, null, 2)}
        </pre>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Upcoming Bookings ({upcomingBookings.length}):</h2>
        <p className="text-sm text-gray-600 mb-2">Today is: {today.toISOString()}</p>
        <pre className="bg-gray-100 p-4 rounded text-sm">
          {JSON.stringify(upcomingBookings, null, 2)}
        </pre>
      </div>
    </div>
  )
}