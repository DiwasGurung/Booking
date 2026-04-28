/*
  Warnings:

  - You are about to drop the column `emailVerificationToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerificationTokenExpires` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[emailVerificationCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_emailVerificationToken_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailVerificationToken",
DROP COLUMN "emailVerificationTokenExpires",
ADD COLUMN     "emailVerificationAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "emailVerificationCode" TEXT,
ADD COLUMN     "emailVerificationCodeExpires" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_emailVerificationCode_key" ON "User"("emailVerificationCode");
