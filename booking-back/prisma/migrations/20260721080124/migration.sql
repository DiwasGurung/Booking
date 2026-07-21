/*
  Warnings:

  - You are about to drop the column `firebaseUid` on the `User` table. All the data in the column will be lost.
  - Added the required column `priceMonthlyNPR` to the `subscription_plans` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BillingPeriod" AS ENUM ('MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY');

-- DropIndex
DROP INDEX "User_firebaseUid_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "firebaseUid";

-- AlterTable
ALTER TABLE "subscription_plans" ADD COLUMN     "priceAnnualNPR" INTEGER,
ADD COLUMN     "priceMonthlyNPR" INTEGER NOT NULL,
ADD COLUMN     "priceQuarterlyNPR" INTEGER,
ADD COLUMN     "priceSemiAnnualNPR" INTEGER;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "billingCycleEndDate" TIMESTAMP(3),
ADD COLUMN     "billingPeriod" "BillingPeriod" NOT NULL DEFAULT 'MONTHLY';
