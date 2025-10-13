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

-- CreateTable
CREATE TABLE "blocked_dates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacher_id" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "reason" TEXT NOT NULL,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurring_type" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "blocked_dates_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "booking_settings_teacher_id_key" ON "booking_settings"("teacher_id");

-- CreateIndex
CREATE INDEX "blocked_dates_teacher_id_date_idx" ON "blocked_dates"("teacher_id", "date");
