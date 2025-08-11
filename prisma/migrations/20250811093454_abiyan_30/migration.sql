-- AlterTable
ALTER TABLE "Highlight" ADD COLUMN     "specificCategoryId" INTEGER;

-- AddForeignKey
ALTER TABLE "Highlight" ADD CONSTRAINT "Highlight_specificCategoryId_fkey" FOREIGN KEY ("specificCategoryId") REFERENCES "SpecificCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
