/*
  Warnings:

  - A unique constraint covering the columns `[nabilRefId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Business_email_key";

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "nabilRefId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "payments_nabilRefId_key" ON "payments"("nabilRefId");
