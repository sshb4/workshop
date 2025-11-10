// scripts/check-teachers.js
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkTeachers() {
  try {
    // Print the database URL for debugging
    console.log('CHECK-TEACHERS SCRIPT DATABASE_URL:', process.env.DATABASE_URL)
    console.log('Checking all teachers using Prisma...')
    const teachers = await prisma.teacher.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        subdomain: true,
        emailVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    })
    console.log('All teachers:', teachers)
  } catch (error) {
    console.error('Error checking teachers:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTeachers()