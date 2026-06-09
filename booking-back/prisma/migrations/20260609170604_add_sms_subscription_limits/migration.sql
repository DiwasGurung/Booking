-- AlterTable
ALTER TABLE "sms_logs" ADD COLUMN     "businessId" TEXT,
ADD COLUMN     "subscriptionId" TEXT;

-- AlterTable
ALTER TABLE "subscription_plans" ADD COLUMN     "maxSmsPerMonth" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "smsCreditBalance" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "smsUsedThisMonth" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "sms_logs_subscriptionId_idx" ON "sms_logs"("subscriptionId");

-- AddForeignKey
ALTER TABLE "sms_logs" ADD CONSTRAINT "sms_logs_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
