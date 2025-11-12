/*
  Warnings:

  - You are about to drop the column `time_format` on the `teachers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "quote_description" TEXT,
ADD COLUMN     "quote_duration" TEXT,
ADD COLUMN     "quote_notes" TEXT,
ADD COLUMN     "quote_sent_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "teachers" DROP COLUMN "time_format";
