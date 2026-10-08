/*
  Warnings:

  - A unique constraint covering the columns `[branchId,dayOfWeek]` on the table `BusinessHours` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[branchId,date]` on the table `ClosedDate` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "BusinessHours_businessId_dayOfWeek_key";

-- DropIndex
DROP INDEX "ClosedDate_businessId_date_key";

-- CreateIndex
CREATE UNIQUE INDEX "BusinessHours_branchId_dayOfWeek_key" ON "BusinessHours"("branchId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "ClosedDate_branchId_date_key" ON "ClosedDate"("branchId", "date");
