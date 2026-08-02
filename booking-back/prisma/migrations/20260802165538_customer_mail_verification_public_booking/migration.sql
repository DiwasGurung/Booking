/*
  Warnings:

  - A unique constraint covering the columns `[verificationToken]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'UNVERIFIED';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificationToken" TEXT,
ADD COLUMN     "verificationTokenExpires" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_verificationToken_key" ON "Booking"("verificationToken");
