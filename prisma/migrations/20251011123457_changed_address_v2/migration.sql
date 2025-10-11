/*
  Warnings:

  - The `type` column on the `addresses` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('SHIPPING', 'BILLING');

-- AlterTable
ALTER TABLE "addresses" DROP COLUMN "type",
ADD COLUMN     "type" "AddressType" NOT NULL DEFAULT 'SHIPPING';
