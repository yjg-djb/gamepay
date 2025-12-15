-- CreateEnum
CREATE TYPE "MerchantStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- AlterTable
ALTER TABLE "Merchant" ADD COLUMN     "email" TEXT,
ADD COLUMN     "status" "MerchantStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "visitorId" TEXT;

-- AlterTable
ALTER TABLE "SKU" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "MerchantGame" (
    "merchantId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantGame_pkey" PRIMARY KEY ("merchantId","gameId")
);

-- CreateIndex
CREATE INDEX "MerchantGame_merchantId_idx" ON "MerchantGame"("merchantId");

-- CreateIndex
CREATE INDEX "MerchantGame_gameId_idx" ON "MerchantGame"("gameId");

-- AddForeignKey
ALTER TABLE "MerchantGame" ADD CONSTRAINT "MerchantGame_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantGame" ADD CONSTRAINT "MerchantGame_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
