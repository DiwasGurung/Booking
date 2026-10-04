/*
  Warnings:

  - You are about to drop the column `maxSmsPerMonth` on the `subscription_plans` table. All the data in the column will be lost.
  - You are about to drop the column `smsCreditBalance` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `smsUsedThisMonth` on the `subscriptions` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SmsCreditTransactionType" AS ENUM ('PURCHASE', 'PLAN_GRANT', 'BONUS', 'USAGE', 'REFUND', 'ADJUSTMENT');

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "smsCredits" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "purpose" TEXT NOT NULL DEFAULT 'SUBSCRIPTION',
ADD COLUMN     "smsCreditPackageId" TEXT;

-- AlterTable
ALTER TABLE "sms_logs" ADD COLUMN     "creditsUsed" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "subscription_plans" DROP COLUMN "maxSmsPerMonth",
ADD COLUMN     "monthlySmsCredits" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "smsCreditBalance",
DROP COLUMN "smsUsedThisMonth";

-- CreateTable
CREATE TABLE "sms_credit_transactions" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "type" "SmsCreditTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "description" TEXT,
    "paymentId" TEXT,
    "smsLogId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_credit_packages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "bonusCredits" INTEGER NOT NULL DEFAULT 0,
    "priceNPR" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sms_credit_packages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sms_credit_transactions_paymentId_key" ON "sms_credit_transactions"("paymentId");

-- CreateIndex
CREATE INDEX "sms_credit_transactions_businessId_createdAt_idx" ON "sms_credit_transactions"("businessId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "sms_credit_packages_name_key" ON "sms_credit_packages"("name");

-- AddForeignKey
ALTER TABLE "sms_credit_transactions" ADD CONSTRAINT "sms_credit_transactions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
