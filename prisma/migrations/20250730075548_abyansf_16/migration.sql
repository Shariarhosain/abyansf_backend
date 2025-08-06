/*
  Warnings:

  - Added the required column `miniSubCategoryId` to the `SubCategory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SubCategory" ADD COLUMN     "hasMiniSubCategory" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "miniSubCategoryId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "MiniSubCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "img" TEXT,
    "hasSpecificCategory" BOOLEAN NOT NULL DEFAULT false,
    "subCategoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contractWhatsapp" BOOLEAN NOT NULL DEFAULT false,
    "fromName" TEXT,
    "hasForm" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MiniSubCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MiniSubCategory_subCategoryId_idx" ON "MiniSubCategory"("subCategoryId");

-- CreateIndex
CREATE INDEX "MiniSubCategory_hasSpecificCategory_idx" ON "MiniSubCategory"("hasSpecificCategory");

-- CreateIndex
CREATE INDEX "MiniSubCategory_createdAt_idx" ON "MiniSubCategory"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MiniSubCategory_subCategoryId_name_key" ON "MiniSubCategory"("subCategoryId", "name");

-- AddForeignKey
ALTER TABLE "MiniSubCategory" ADD CONSTRAINT "MiniSubCategory_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
