-- CreateEnum
CREATE TYPE "StaffGender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "StaffEmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "staffs" (
    "id" TEXT NOT NULL,
    "staffCode" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "gender" "StaffGender" NOT NULL,
    "departmentCode" TEXT,
    "departmentName" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "employmentType" "StaffEmploymentType" NOT NULL DEFAULT 'FULL_TIME',
    "joiningDate" TIMESTAMP(3) NOT NULL,
    "salary" DOUBLE PRECISION,
    "address" TEXT,
    "status" "StaffStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staffs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staffs_staffCode_key" ON "staffs"("staffCode");

-- CreateIndex
CREATE UNIQUE INDEX "staffs_email_key" ON "staffs"("email");
