// scripts/apply-migration.js
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function applyMigration() {
  try {
    console.log('Applying database migration...')
    
    // Read the migration SQL
    const migrationPath = path.join(__dirname, '..', 'prisma', 'migrations', '20251013000000_add_booking_settings_and_date_ranges', 'migration.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Split by semicolons and execute each statement
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim())
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim().substring(0, 50) + '...')
        await prisma.$executeRawUnsafe(statement.trim())
      }
    }
    
    console.log('Migration applied successfully!')
  } catch (error) {
    console.error('Error applying migration:', error)
  } finally {
    await prisma.$disconnect()
  }
}

applyMigration()