-- CreateEnum
CREATE TYPE "VerificationEntityType" AS ENUM ('USER', 'STAFF', 'BUSINESS', 'BOOKING');

-- CreateEnum
CREATE TYPE "VerificationChannel" AS ENUM ('SMS', 'EMAIL');

-- CreateEnum
CREATE TYPE "VerificationPurpose" AS ENUM ('PHONE_VERIFICATION', 'LOGIN_OTP', 'PASSWORD_RESET_OTP');

-- CreateEnum
CREATE TYPE "SmsStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phoneVerificationAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "phoneVerificationCode" TEXT,
ADD COLUMN     "phoneVerificationCodeExpires" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "smsNotificationsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "subscription_plans" ADD COLUMN     "allowSmsNotifications" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxSmsPerMonth" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "smsCreditBalance" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "smsUsedThisMonth" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "sms_logs" (
    "id" TEXT NOT NULL,
    "businessId" TEXT,
    "subscriptionId" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "messageId" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'SPARROW',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_codes" (
    "id" TEXT NOT NULL,
    "entityType" "VerificationEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "channel" "VerificationChannel" NOT NULL,
    "purpose" "VerificationPurpose" NOT NULL,
    "destination" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sms_logs_businessId_idx" ON "sms_logs"("businessId");

-- CreateIndex
CREATE INDEX "sms_logs_phoneNumber_idx" ON "sms_logs"("phoneNumber");

-- CreateIndex
CREATE INDEX "sms_logs_status_idx" ON "sms_logs"("status");

-- CreateIndex
CREATE INDEX "sms_logs_type_idx" ON "sms_logs"("type");

-- CreateIndex
CREATE INDEX "verification_codes_entityType_entityId_purpose_idx" ON "verification_codes"("entityType", "entityId", "purpose");

-- CreateIndex
CREATE INDEX "verification_codes_destination_idx" ON "verification_codes"("destination");

-- AddForeignKey
ALTER TABLE "sms_logs" ADD CONSTRAINT "sms_logs_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_logs" ADD CONSTRAINT "sms_logs_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
