-- CreateTable
CREATE TABLE "time_offs" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "staffId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "type" TEXT NOT NULL DEFAULT 'BREAK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_offs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_holidays" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClosedDate" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClosedDate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "time_offs_businessId_idx" ON "time_offs"("businessId");

-- CreateIndex
CREATE INDEX "time_offs_staffId_idx" ON "time_offs"("staffId");

-- CreateIndex
CREATE INDEX "time_offs_startDate_idx" ON "time_offs"("startDate");

-- CreateIndex
CREATE INDEX "staff_holidays_businessId_idx" ON "staff_holidays"("businessId");

-- CreateIndex
CREATE INDEX "staff_holidays_date_idx" ON "staff_holidays"("date");

-- CreateIndex
CREATE UNIQUE INDEX "staff_holidays_businessId_date_key" ON "staff_holidays"("businessId", "date");

-- CreateIndex
CREATE INDEX "ClosedDate_businessId_idx" ON "ClosedDate"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "ClosedDate_businessId_date_key" ON "ClosedDate"("businessId", "date");

-- AddForeignKey
ALTER TABLE "time_offs" ADD CONSTRAINT "time_offs_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_offs" ADD CONSTRAINT "time_offs_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_holidays" ADD CONSTRAINT "staff_holidays_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClosedDate" ADD CONSTRAINT "ClosedDate_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
