-- CreateEnum
CREATE TYPE "CardBrand" AS ENUM ('VISA', 'MASTERCARD', 'ELO', 'AMEX', 'HIPERCARD', 'DINERS', 'OTHER');

-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "brand" "CardBrand" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "lastFourDigits" CHAR(4);
