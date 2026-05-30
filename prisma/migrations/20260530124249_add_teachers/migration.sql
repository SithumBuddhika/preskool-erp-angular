-- CreateEnum
CREATE TYPE "TeacherGender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "TeacherStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "teachers" (
    "id" TEXT NOT NULL,
    "employeeNo" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "gender" "TeacherGender" NOT NULL,
    "subject" TEXT NOT NULL,
    "qualification" TEXT,
    "joiningDate" TIMESTAMP(3) NOT NULL,
    "address" TEXT,
    "status" "TeacherStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teachers_employeeNo_key" ON "teachers"("employeeNo");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_email_key" ON "teachers"("email");
