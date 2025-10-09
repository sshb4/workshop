/*
  Warnings:

  - Added the required column `start_date` to the `availability_slots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `availability_slots` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_availability_slots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacher_id" TEXT NOT NULL,
    "title" TEXT,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "availability_slots_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_availability_slots" ("created_at", "day_of_week", "end_time", "id", "start_time", "teacher_id", "start_date", "updated_at", "title", "end_date", "is_active") 
SELECT 
    "created_at", 
    "day_of_week", 
    "end_time", 
    "id", 
    "start_time", 
    "teacher_id",
    '2025-01-01' as "start_date",  -- Default start date for existing slots
    CURRENT_TIMESTAMP as "updated_at",  -- Set updated_at to current time
    'Regular Hours' as "title",  -- Default title
    NULL as "end_date",  -- Ongoing availability
    true as "is_active"  -- Active by default
FROM "availability_slots";
DROP TABLE "availability_slots";
ALTER TABLE "new_availability_slots" RENAME TO "availability_slots";
CREATE INDEX "availability_slots_teacher_id_start_date_end_date_idx" ON "availability_slots"("teacher_id", "start_date", "end_date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
