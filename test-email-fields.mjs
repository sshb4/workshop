// Test script to verify email system setup
import { prisma } from '../lib/prisma.js'

async function testEmailFields() {
  try {
    // Try to query a teacher with email verification fields
    const teacher = await prisma.teacher.findFirst({
      select: {
        id: true,
        email: true,
        emailVerified: true,
        verificationToken: true,
        tokenExpiry: true,
        resetToken: true,
        resetTokenExpiry: true
      }
    })
    
    console.log('✅ Email verification fields are working!')
    console.log('Sample teacher data:', teacher)
    
  } catch (error) {
    console.error('❌ Error accessing email fields:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testEmailFields()
