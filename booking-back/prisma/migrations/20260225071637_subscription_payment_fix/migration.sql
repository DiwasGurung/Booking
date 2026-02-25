/*
  Warnings:

  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Subscription` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SubscriptionPlan` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_businessId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_businessId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_planId_fkey";

-- DropTable
DROP TABLE "Payment";

-- DropTable
DROP TABLE "Subscription";

-- DropTable
DROP TABLE "SubscriptionPlan";

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "bookingId" TEXT,
    "subscriptionId" TEXT,
    "gateway" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "esewaRefId" TEXT,
    "esewaProductCode" TEXT,
    "khaltiPidx" TEXT,
    "khaltiToken" TEXT,
    "reference" TEXT,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "payload" JSONB,
    "errorMessage" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'NPR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceNPR" INTEGER NOT NULL,
    "displayName" TEXT NOT NULL,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "durationDays" INTEGER NOT NULL DEFAULT 30,
    "currency" TEXT NOT NULL DEFAULT 'NPR',
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "lastPaymentId" TEXT,
    "nextRenewalDate" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "isTrialUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_bookingId_key" ON "payments"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_transactionId_key" ON "payments"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_esewaRefId_key" ON "payments"("esewaRefId");

-- CreateIndex
CREATE INDEX "payments_businessId_idx" ON "payments"("businessId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_gateway_idx" ON "payments"("gateway");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_name_key" ON "subscription_plans"("name");

-- CreateIndex
CREATE INDEX "subscription_plans_active_idx" ON "subscription_plans"("active");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_businessId_key" ON "subscriptions"("businessId");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_endDate_idx" ON "subscriptions"("endDate");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
