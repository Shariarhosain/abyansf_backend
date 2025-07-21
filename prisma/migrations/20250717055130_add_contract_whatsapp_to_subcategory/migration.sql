-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "formName" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "menuImages" TEXT[],
ADD COLUMN     "typeofservice" TEXT[],
ADD COLUMN     "venueName" TEXT[];

-- AlterTable
ALTER TABLE "SubCategory" ADD COLUMN     "contractWhatsapp" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fromName" TEXT,
ADD COLUMN     "hasForm" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "listingBooking" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" INTEGER NOT NULL,
    "bookingDate" DATE,
    "bookingTime" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "name" TEXT,
    "email" TEXT,
    "whatsapp" TEXT,
    "typeofservice" TEXT,
    "numberofguest_adult" INTEGER,
    "numberofguest_child" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listingBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_specific_category_sub_category_name" ON "SpecificCategory"("subCategoryId", "name");

-- AddForeignKey
ALTER TABLE "listingBooking" ADD CONSTRAINT "listingBooking_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listingBooking" ADD CONSTRAINT "listingBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
