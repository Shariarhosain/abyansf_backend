/*
  Warnings:

  - The `description` column on the `SubCategory` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "SubCategory" DROP COLUMN "description",
ADD COLUMN     "description" JSONB;
