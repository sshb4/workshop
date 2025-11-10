// scripts/check-teachers.js
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkTeachers() {
  try {
    // Print the database URL for debugging
    console.log('CHECK-TEACHERS SCRIPT DATABASE_URL:', process.env.DATABASE_URL)
    console.log('Checking existing teachers...')
    const teachers = await prisma.$queryRaw`
      SELECT id, name, email FROM teachers LIMIT 5
    `
    console.log('Existing teachers:', teachers)
  } catch (error) {
    console.error('Error checking teachers:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTeachers()