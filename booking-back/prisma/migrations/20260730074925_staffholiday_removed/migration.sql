/*
  Warnings:

  - You are about to drop the `staff_holidays` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "staff_holidays" DROP CONSTRAINT "staff_holidays_businessId_fkey";

-- DropTable
DROP TABLE "staff_holidays";
