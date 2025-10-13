// scripts/update-blocked-dates.js
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateBlockedDatesTable() {
  try {
    console.log('Updating blocked_dates table structure...')
    
    // First, add the new columns
    console.log('Adding start_date column...')
    await prisma.$executeRawUnsafe(`
      ALTER TABLE blocked_dates ADD COLUMN start_date DATETIME
    `)
    
    console.log('Adding end_date column...')
    await prisma.$executeRawUnsafe(`
      ALTER TABLE blocked_dates ADD COLUMN end_date DATETIME
    `)
    
    // Copy data from old date column to new columns
    console.log('Copying data from date to start_date and end_date...')
    await prisma.$executeRawUnsafe(`
      UPDATE blocked_dates SET start_date = date, end_date = date WHERE start_date IS NULL
    `)
    
    // Make the new columns NOT NULL
    console.log('Making new columns NOT NULL...')
    await prisma.$executeRawUnsafe(`
      CREATE TABLE blocked_dates_new (
        id TEXT NOT NULL PRIMARY KEY,
        teacher_id TEXT NOT NULL,
        start_date DATETIME NOT NULL,
        end_date DATETIME NOT NULL,
        reason TEXT NOT NULL,
        is_recurring BOOLEAN NOT NULL DEFAULT false,
        recurring_type TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL,
        CONSTRAINT blocked_dates_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES teachers (id) ON DELETE CASCADE ON UPDATE CASCADE
      )
    `)
    
    console.log('Copying data to new table...')
    await prisma.$executeRawUnsafe(`
      INSERT INTO blocked_dates_new (id, teacher_id, start_date, end_date, reason, is_recurring, recurring_type, created_at, updated_at)
      SELECT id, teacher_id, start_date, end_date, reason, is_recurring, recurring_type, created_at, updated_at
      FROM blocked_dates
    `)
    
    console.log('Dropping old table...')
    await prisma.$executeRawUnsafe(`DROP TABLE blocked_dates`)
    
    console.log('Renaming new table...')
    await prisma.$executeRawUnsafe(`ALTER TABLE blocked_dates_new RENAME TO blocked_dates`)
    
    console.log('Creating index...')
    await prisma.$executeRawUnsafe(`
      CREATE INDEX blocked_dates_teacher_id_start_date_end_date_idx ON blocked_dates(teacher_id, start_date, end_date)
    `)
    
    console.log('✅ blocked_dates table updated successfully!')
    
  } catch (error) {
    console.error('Error updating blocked_dates table:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateBlockedDatesTable()