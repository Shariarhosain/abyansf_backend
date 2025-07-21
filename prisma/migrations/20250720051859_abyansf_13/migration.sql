-- CreateTable
CREATE TABLE "subCategoryBooking" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "subCategoryId" INTEGER NOT NULL,
    "bookingInfo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subCategoryBooking_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "subCategoryBooking" ADD CONSTRAINT "subCategoryBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subCategoryBooking" ADD CONSTRAINT "subCategoryBooking_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
