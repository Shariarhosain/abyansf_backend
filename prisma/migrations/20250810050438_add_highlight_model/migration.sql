-- CreateEnum
CREATE TYPE "HighlightType" AS ENUM ('SUBCATEGORY', 'MINI_CATEGORY', 'LISTING');

-- CreateTable
CREATE TABLE "Highlight" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "type" "HighlightType" NOT NULL,
    "subCategoryId" INTEGER,
    "miniSubCategoryId" INTEGER,
    "listingId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Highlight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Highlight_isActive_idx" ON "Highlight"("isActive");

-- CreateIndex
CREATE INDEX "Highlight_priority_idx" ON "Highlight"("priority");

-- CreateIndex
CREATE INDEX "Highlight_type_idx" ON "Highlight"("type");

-- CreateIndex
CREATE INDEX "Highlight_subCategoryId_idx" ON "Highlight"("subCategoryId");

-- CreateIndex
CREATE INDEX "Highlight_miniSubCategoryId_idx" ON "Highlight"("miniSubCategoryId");

-- CreateIndex
CREATE INDEX "Highlight_listingId_idx" ON "Highlight"("listingId");

-- CreateIndex
CREATE INDEX "Highlight_createdAt_idx" ON "Highlight"("createdAt");

-- AddForeignKey
ALTER TABLE "Highlight" ADD CONSTRAINT "Highlight_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Highlight" ADD CONSTRAINT "Highlight_miniSubCategoryId_fkey" FOREIGN KEY ("miniSubCategoryId") REFERENCES "MiniSubCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Highlight" ADD CONSTRAINT "Highlight_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
