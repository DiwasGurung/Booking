-- AlterTable
ALTER TABLE "subscription_plans" ADD COLUMN     "trialSmsCredits" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "trialCreditsGranted" BOOLEAN NOT NULL DEFAULT false;
