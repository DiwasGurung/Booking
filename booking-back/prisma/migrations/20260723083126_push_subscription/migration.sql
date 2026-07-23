/*
  Warnings:

  - You are about to drop the column `keys` on the `push_subscriptions` table. All the data in the column will be lost.
  - Added the required column `auth` to the `push_subscriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `p256dh` to the `push_subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "push_subscriptions" DROP COLUMN "keys",
ADD COLUMN     "auth" TEXT NOT NULL,
ADD COLUMN     "p256dh" TEXT NOT NULL;
