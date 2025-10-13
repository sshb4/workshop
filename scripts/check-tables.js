// scripts/check-tables.js
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkTables() {
  try {
    console.log('Checking database tables...')
    
    // Check if booking_settings table exists and its structure
    try {
      const bookingSettings = await prisma.$queryRaw`
        SELECT * FROM booking_settings LIMIT 1
      `
      console.log('✅ booking_settings table exists')
    } catch (error) {
      console.log('❌ booking_settings table:', error.message)
    }
    
    // Check if blocked_dates table has the new columns
    try {
      const blockedDates = await prisma.$queryRaw`
        SELECT start_date, end_date FROM blocked_dates LIMIT 1
      `
      console.log('✅ blocked_dates table has date range columns')
    } catch (error) {
      console.log('❌ blocked_dates date range columns:', error.message)
    }
    
    // Check the table schema
    try {
      const schema = await prisma.$queryRaw`
        PRAGMA table_info(blocked_dates)
      `
      console.log('blocked_dates table schema:', schema)
    } catch (error) {
      console.log('Error checking schema:', error.message)
    }
    
  } catch (error) {
    console.error('Error checking tables:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTables()