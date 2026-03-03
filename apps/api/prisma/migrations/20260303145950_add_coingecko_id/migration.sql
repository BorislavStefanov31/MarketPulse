/*
  Warnings:

  - A unique constraint covering the columns `[coingeckoId]` on the table `Asset` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "coingeckoId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Asset_coingeckoId_key" ON "Asset"("coingeckoId");
