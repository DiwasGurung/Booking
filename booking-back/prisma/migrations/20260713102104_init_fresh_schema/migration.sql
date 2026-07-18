/*
  Warnings:

  - The values [FIREBASE] on the enum `AuthProvider` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `staffId` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `allowCustomBranding` on the `subscription_plans` table. All the data in the column will be lost.
  - You are about to drop the column `allowEmailNotifications` on the `subscription_plans` table. All the data in the column will be lost.
  - You are about to drop the column `allowOnlineBooking` on the `subscription_plans` table. All the data in the column will be lost.
  - You are about to drop the column `allowReports` on the `subscription_plans` table. All the data in the column will be lost.
  - You are about to drop the column `allowSmsNotifications` on the `subscription_plans` table. All the data in the column will be lost.
  - You are about to drop the column `maxAppointmentsPerMonth` on the `subscription_plans` table. All the data in the column will be lost.
  - You are about to drop the column `maxCustomers` on the `subscription_plans` table. All the data in the column will be lost.
  - You are about to drop the column `maxServices` on the `subscription_plans` table. All the data in the column will be lost.
  - You are about to drop the column `maxSmsPerMonth` on the `subscription_plans` table. All the data in the column will be lost.
  - You are about to drop the column `maxStaff` on the `subscription_plans` table. All the data in the column will be lost.
  - You are about to drop the column `prioritySupport` on the `subscription_plans` table. All the data in the column will be lost.
  - You are about to drop the column `appointmentsThisMonth` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `smsCreditBalance` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `smsUsedThisMonth` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `usageResetDate` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the `Staff` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StaffService` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `push_subscriptions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sms_logs` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[email]` on the table `Business` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AuthProvider_new" AS ENUM ('EMAIL', 'GOOGLE');
ALTER TABLE "public"."User" ALTER COLUMN "authProvider" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "authProvider" TYPE "AuthProvider_new" USING ("authProvider"::text::"AuthProvider_new");
ALTER TYPE "AuthProvider" RENAME TO "AuthProvider_old";
ALTER TYPE "AuthProvider_new" RENAME TO "AuthProvider";
DROP TYPE "public"."AuthProvider_old";
ALTER TABLE "User" ALTER COLUMN "authProvider" SET DEFAULT 'EMAIL';
COMMIT;

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_staffId_fkey";

-- DropForeignKey
ALTER TABLE "Staff" DROP CONSTRAINT "Staff_businessId_fkey";

-- DropForeignKey
ALTER TABLE "StaffService" DROP CONSTRAINT "StaffService_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "StaffService" DROP CONSTRAINT "StaffService_staffId_fkey";

-- DropForeignKey
ALTER TABLE "sms_logs" DROP CONSTRAINT "sms_logs_subscriptionId_fkey";

-- DropIndex
DROP INDEX "Booking_staffId_idx";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "staffId";

-- AlterTable
ALTER TABLE "subscription_plans" DROP COLUMN "allowCustomBranding",
DROP COLUMN "allowEmailNotifications",
DROP COLUMN "allowOnlineBooking",
DROP COLUMN "allowReports",
DROP COLUMN "allowSmsNotifications",
DROP COLUMN "maxAppointmentsPerMonth",
DROP COLUMN "maxCustomers",
DROP COLUMN "maxServices",
DROP COLUMN "maxSmsPerMonth",
DROP COLUMN "maxStaff",
DROP COLUMN "prioritySupport";

-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "appointmentsThisMonth",
DROP COLUMN "smsCreditBalance",
DROP COLUMN "smsUsedThisMonth",
DROP COLUMN "usageResetDate";

-- DropTable
DROP TABLE "Staff";

-- DropTable
DROP TABLE "StaffService";

-- DropTable
DROP TABLE "push_subscriptions";

-- DropTable
DROP TABLE "sms_logs";

-- CreateIndex
CREATE UNIQUE INDEX "Business_email_key" ON "Business"("email");
