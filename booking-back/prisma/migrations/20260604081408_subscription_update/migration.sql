-- AlterTable
ALTER TABLE "subscription_plans" ADD COLUMN     "allowCustomBranding" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "allowEmailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowOnlineBooking" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowReports" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "allowSmsNotifications" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxAppointmentsPerMonth" INTEGER NOT NULL DEFAULT -1,
ADD COLUMN     "maxCustomers" INTEGER NOT NULL DEFAULT -1,
ADD COLUMN     "maxServices" INTEGER NOT NULL DEFAULT -1,
ADD COLUMN     "maxStaff" INTEGER NOT NULL DEFAULT -1,
ADD COLUMN     "prioritySupport" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "appointmentsThisMonth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "usageResetDate" TIMESTAMP(3);
