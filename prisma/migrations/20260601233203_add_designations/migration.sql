-- CreateEnum
CREATE TYPE "DesignationStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "designations" (
    "id" TEXT NOT NULL,
    "designationCode" TEXT NOT NULL,
    "designationName" TEXT NOT NULL,
    "departmentCode" TEXT,
    "departmentName" TEXT,
    "description" TEXT,
    "status" "DesignationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "designations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "designations_designationCode_key" ON "designations"("designationCode");
