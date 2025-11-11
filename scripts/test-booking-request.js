// Test booking request functionality
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testBookingRequest() {
  try {
    console.log('Checking teachers...')
    
    const teachers = await prisma.teacher.findMany({
      select: {
        id: true,
        name: true,
        subdomain: true,
        email: true
      }
    })
    
    console.log('Available teachers:')
    teachers.forEach(teacher => {
      console.log(`- ${teacher.name} (${teacher.subdomain}) - ${teacher.email}`)
    })
    
    if (teachers.length === 0) {
      console.log('No teachers found. Creating a demo teacher...')
      
      const demoTeacher = await prisma.teacher.create({
        data: {
          subdomain: 'demo',
          name: 'Demo Teacher',
          email: 'demo@example.com',
          passwordHash: '$2a$12$dummy.hash.for.demo.purposes',
          title: 'Demo Instructor',
          bio: 'This is a demo teacher for testing purposes',
          hourlyRate: 50,
        }
      })
      
      console.log(`Created demo teacher: ${demoTeacher.name} (${demoTeacher.subdomain})`)
      return demoTeacher
    }
    
    return teachers[0]
  } catch (error) {
    console.error('Error testing booking request:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testBookingRequest()
