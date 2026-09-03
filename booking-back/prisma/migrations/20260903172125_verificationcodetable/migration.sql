/*
  Warnings:

  - You are about to drop the column `phoneVerificationAttempts` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `phoneVerificationCode` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `phoneVerificationCodeExpires` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `phoneVerificationAttempts` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phoneVerificationCode` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phoneVerificationCodeExpires` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_phoneVerificationCode_key";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "phoneVerificationAttempts",
DROP COLUMN "phoneVerificationCode",
DROP COLUMN "phoneVerificationCodeExpires";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "phoneVerificationAttempts",
DROP COLUMN "phoneVerificationCode",
DROP COLUMN "phoneVerificationCodeExpires";
