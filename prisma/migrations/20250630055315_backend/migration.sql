-- AlterTable
ALTER TABLE "user" ADD COLUMN     "address" TEXT DEFAULT 'Dubai',
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "gender" TEXT;
