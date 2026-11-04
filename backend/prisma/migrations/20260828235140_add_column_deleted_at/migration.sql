/*
  Warnings:

  - Added the required column `deletedAt` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deletedAt` to the `Card` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deletedAt` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deletedAt` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "deletedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "deletedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "deletedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "deletedAt" TIMESTAMP(3) NOT NULL;
