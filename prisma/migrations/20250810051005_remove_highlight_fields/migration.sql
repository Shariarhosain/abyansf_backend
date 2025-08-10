/*
  Warnings:

  - You are about to drop the column `description` on the `Highlight` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Highlight` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Highlight` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Highlight" DROP COLUMN "description",
DROP COLUMN "imageUrl",
DROP COLUMN "title";
