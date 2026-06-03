-- CreateEnum
CREATE TYPE "HostelType" AS ENUM ('BOYS', 'GIRLS', 'MIXED');

-- CreateEnum
CREATE TYPE "HostelStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateTable
CREATE TABLE "hostels" (
    "id" TEXT NOT NULL,
    "hostelCode" TEXT NOT NULL,
    "hostelName" TEXT NOT NULL,
    "hostelType" "HostelType" NOT NULL,
    "wardenName" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "totalRooms" INTEGER NOT NULL DEFAULT 1,
    "totalBeds" INTEGER NOT NULL DEFAULT 1,
    "availableBeds" INTEGER NOT NULL DEFAULT 1,
    "monthlyFee" DOUBLE PRECISION,
    "status" "HostelStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hostels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hostels_hostelCode_key" ON "hostels"("hostelCode");
