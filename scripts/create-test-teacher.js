// scripts/create-test-teacher.js
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTestTeacher() {
  try {
    console.log('Connecting to database...')
    
    // Test connection first
    await prisma.$connect()
    console.log('✅ Database connected successfully!')
    
    // Hash the password
    const hashedPassword = bcrypt.hashSync('password123', 10)
    
    // Create test teacher
    const teacher = await prisma.teacher.create({
      data: {
        subdomain: 'maria',
        name: 'Maria Garcia',
        email: 'maria@example.com',
        passwordHash: hashedPassword,
        bio: 'Professional dance instructor with 10+ years of experience.',
        hourlyRate: 50.0,
        phone: '+1-555-0123',
      },
    })
    
    console.log('✅ Test teacher created:', teacher)
    
    // Check if teacher exists
    const allTeachers = await prisma.teacher.findMany()
    console.log('📊 All teachers in database:', allTeachers)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    
    if (error.message.includes("Can't reach database server")) {
      console.log('💡 Database connection issue - Neon database might be sleeping')
      console.log('💡 Try visiting your Neon dashboard to wake it up')
    }
  } finally {
    await prisma.$disconnect()
  }
}

createTestTeacher()
