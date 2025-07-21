/*
  Warnings:

  - You are about to drop the column `email` on the `log` table. All the data in the column will be lost.
  - Made the column `action` on table `log` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "log" DROP COLUMN "email",
ALTER COLUMN "action" SET NOT NULL;

-- AlterTable
ALTER TABLE "varification" ADD COLUMN     "email" TEXT;
