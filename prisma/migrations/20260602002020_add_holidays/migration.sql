-- CreateEnum
CREATE TYPE "HolidayType" AS ENUM ('PUBLIC', 'SCHOOL', 'EVENT', 'OTHER');

-- CreateEnum
CREATE TYPE "HolidayStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "holidays" (
    "id" TEXT NOT NULL,
    "holidayCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "holidayType" "HolidayType" NOT NULL DEFAULT 'PUBLIC',
    "description" TEXT,
    "status" "HolidayStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "holidays_holidayCode_key" ON "holidays"("holidayCode");
