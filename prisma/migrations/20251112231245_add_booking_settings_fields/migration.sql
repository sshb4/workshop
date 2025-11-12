-- AlterTable
ALTER TABLE "booking_settings" ADD COLUMN     "allow_customer_book" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allow_manual_book" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "form_fields" TEXT;
