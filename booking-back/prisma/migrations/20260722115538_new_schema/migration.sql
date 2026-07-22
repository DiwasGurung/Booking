/*
  Warnings:

  - You are about to drop the column `auth` on the `push_subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `p256dh` on the `push_subscriptions` table. All the data in the column will be lost.
  - You are about to alter the column `priceMonthlyNPR` on the `subscription_plans` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - A unique constraint covering the columns `[verificationToken]` on the table `Staff` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[staffCode]` on the table `Staff` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,endpoint]` on the table `push_subscriptions` will be added. If there are existing duplicate values, this will fail.
  - The required column `staffCode` was added to the `Staff` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `keys` to the `push_subscriptions` table without a default value. This is not possible if the table is not empty.
  - Made the column `priceMonthlyNPR` on table `subscription_plans` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "push_subscriptions" DROP CONSTRAINT "push_subscriptions_userId_fkey";

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "staffCode" TEXT NOT NULL,
ADD COLUMN     "verificationToken" TEXT,
ADD COLUMN     "verificationTokenExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "push_subscriptions" DROP COLUMN "auth",
DROP COLUMN "p256dh",
ADD COLUMN     "keys" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "subscription_plans" ALTER COLUMN "priceMonthlyNPR" SET NOT NULL,
ALTER COLUMN "priceMonthlyNPR" SET DATA TYPE INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Staff_verificationToken_key" ON "Staff"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_staffCode_key" ON "Staff"("staffCode");

-- CreateIndex
CREATE INDEX "Staff_staffCode_idx" ON "Staff"("staffCode");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_userId_endpoint_key" ON "push_subscriptions"("userId", "endpoint");

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
