/*
  Warnings:

  - You are about to drop the column `nabilRefId` on the `payments` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "payments_nabilRefId_key";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "nabilRefId";
