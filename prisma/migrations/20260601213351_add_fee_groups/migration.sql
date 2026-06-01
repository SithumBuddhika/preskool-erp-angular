-- CreateEnum
CREATE TYPE "FeeGroupStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "fee_groups" (
    "id" TEXT NOT NULL,
    "feeGroupCode" TEXT NOT NULL,
    "feeGroupName" TEXT NOT NULL,
    "className" TEXT,
    "section" TEXT,
    "feeType" "FeeType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDays" INTEGER,
    "description" TEXT,
    "status" "FeeGroupStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fee_groups_feeGroupCode_key" ON "fee_groups"("feeGroupCode");
