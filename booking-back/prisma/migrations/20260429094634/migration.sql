/*
  Warnings:

  - A unique constraint covering the columns `[phoneVerificationCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phoneVerificationAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "phoneVerificationCode" TEXT,
ADD COLUMN     "phoneVerificationCodeExpires" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneVerificationCode_key" ON "User"("phoneVerificationCode");
