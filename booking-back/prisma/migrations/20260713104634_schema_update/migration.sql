/*
  Warnings:

  - A unique constraint covering the columns `[nabilRefId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "AuthProvider" ADD VALUE 'FIREBASE';

-- DropIndex
DROP INDEX "Business_email_key";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "staffId" TEXT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "nabilRefId" TEXT;

-- AlterTable
ALTER TABLE "subscription_plans" ADD COLUMN     "allowCustomBranding" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "allowEmailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowOnlineBooking" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowReports" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxAppointmentsPerMonth" INTEGER NOT NULL DEFAULT -1,
ADD COLUMN     "maxCustomers" INTEGER NOT NULL DEFAULT -1,
ADD COLUMN     "maxServices" INTEGER NOT NULL DEFAULT -1,
ADD COLUMN     "maxStaff" INTEGER NOT NULL DEFAULT -1,
ADD COLUMN     "prioritySupport" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "appointmentsThisMonth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "usageResetDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "avatar" TEXT,
    "role" TEXT NOT NULL DEFAULT 'Staff',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "workingHours" JSONB,
    "breakTimes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffService" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Staff_businessId_idx" ON "Staff"("businessId");

-- CreateIndex
CREATE INDEX "Staff_isActive_idx" ON "Staff"("isActive");

-- CreateIndex
CREATE INDEX "StaffService_staffId_idx" ON "StaffService"("staffId");

-- CreateIndex
CREATE INDEX "StaffService_serviceId_idx" ON "StaffService"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffService_staffId_serviceId_key" ON "StaffService"("staffId", "serviceId");

-- CreateIndex
CREATE INDEX "Booking_staffId_idx" ON "Booking"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_nabilRefId_key" ON "payments"("nabilRefId");

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffService" ADD CONSTRAINT "StaffService_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffService" ADD CONSTRAINT "StaffService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
