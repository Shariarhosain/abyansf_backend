-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "contractWhatsapp" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fromName" TEXT,
ADD COLUMN     "hasForm" BOOLEAN NOT NULL DEFAULT false;
