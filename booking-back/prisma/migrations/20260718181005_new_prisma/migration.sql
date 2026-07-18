/*
  Warnings:

  - You are about to drop the column `keys` on the `push_subscriptions` table. All the data in the column will be lost.
  - Added the required column `auth` to the `push_subscriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `p256dh` to the `push_subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "push_subscriptions" DROP CONSTRAINT "push_subscriptions_userId_fkey";

-- DropIndex
DROP INDEX "push_subscriptions_userId_endpoint_key";

-- AlterTable
ALTER TABLE "push_subscriptions" DROP COLUMN "keys",
ADD COLUMN     "auth" TEXT NOT NULL,
ADD COLUMN     "p256dh" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
