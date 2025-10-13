-- CreateTable
CREATE TABLE "booking_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacher_id" TEXT NOT NULL,
    "min_advance_booking" INTEGER NOT NULL DEFAULT 2,
    "max_advance_booking" INTEGER NOT NULL DEFAULT 30,
    "session_duration" INTEGER NOT NULL DEFAULT 60,
    "buffer_time" INTEGER NOT NULL DEFAULT 15,
    "allow_weekends" BOOLEAN NOT NULL DEFAULT true,
    "allow_same_day_booking" BOOLEAN NOT NULL DEFAULT false,
    "cancellation_policy" INTEGER NOT NULL DEFAULT 24,
    "max_sessions_per_day" INTEGER NOT NULL DEFAULT 8,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "booking_settings_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Update blocked_dates table to support date ranges
ALTER TABLE "blocked_dates" RENAME COLUMN "date" TO "start_date";
ALTER TABLE "blocked_dates" ADD COLUMN "end_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Update the end_date to match start_date for existing records
UPDATE "blocked_dates" SET "end_date" = "start_date";

-- CreateIndex
CREATE UNIQUE INDEX "booking_settings_teacher_id_key" ON "booking_settings"("teacher_id");

-- CreateIndex  
CREATE INDEX "blocked_dates_teacher_id_start_date_end_date_idx" ON "blocked_dates"("teacher_id", "start_date", "end_date");

-- Drop old index
DROP INDEX "blocked_dates_teacher_id_date_idx";