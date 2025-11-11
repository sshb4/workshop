// Test creating a booking request to verify the functionality
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createTestBookingRequest() {
  try {
    // Find a teacher
    const teacher = await prisma.teacher.findFirst({
      where: { subdomain: 'sasha' }
    })
    
    if (!teacher) {
      console.log('No teacher found with subdomain "sasha"')
      return
    }
    
    console.log(`Creating test booking request for teacher: ${teacher.name}`)
    
    // Create a test booking request
    const booking = await prisma.booking.create({
      data: {
        teacherId: teacher.id,
        studentName: 'Test Student',
        studentEmail: 'test.student@example.com',
        studentPhone: '555-123-4567',
        bookingDate: new Date(),
        startTime: '00:00',
        endTime: '00:00',
        amountPaid: 0,
        paymentStatus: 'request',
        notes: 'Preferred Dates: Next week weekdays\nAddress: 123 Test St\nNotes: Looking for help with math tutoring',
      }
    })
    
    console.log('✓ Created booking request:', booking.id)
    console.log('Student:', booking.studentName)
    console.log('Status:', booking.paymentStatus)
    console.log('Notes:', booking.notes)
    
    // Check how many total requests this teacher has
    const requestCount = await prisma.booking.count({
      where: {
        teacherId: teacher.id,
        paymentStatus: 'request'
      }
    })
    
    console.log(`\nTeacher now has ${requestCount} pending booking requests`)
    
  } catch (error) {
    console.error('Error creating test booking request:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestBookingRequest()
