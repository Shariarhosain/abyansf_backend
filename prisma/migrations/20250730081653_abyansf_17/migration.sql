-- AlterTable
ALTER TABLE "subCategoryBooking" ADD COLUMN     "miniSubCategoryId" INTEGER;

-- AddForeignKey
ALTER TABLE "subCategoryBooking" ADD CONSTRAINT "subCategoryBooking_miniSubCategoryId_fkey" FOREIGN KEY ("miniSubCategoryId") REFERENCES "MiniSubCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
