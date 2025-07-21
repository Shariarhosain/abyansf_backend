/*
  Warnings:

  - You are about to drop the column `specificCategoryId` on the `HeroSection` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[subCategoryId]` on the table `HeroSection` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `subCategoryId` to the `HeroSection` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "HeroSection" DROP CONSTRAINT "HeroSection_specificCategoryId_fkey";

-- DropIndex
DROP INDEX "HeroSection_specificCategoryId_key";

-- AlterTable
ALTER TABLE "HeroSection" DROP COLUMN "specificCategoryId",
ADD COLUMN     "subCategoryId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "HeroSection_subCategoryId_key" ON "HeroSection"("subCategoryId");

-- AddForeignKey
ALTER TABLE "HeroSection" ADD CONSTRAINT "HeroSection_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
