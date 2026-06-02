-- CreateEnum
CREATE TYPE "StudentAttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY');

-- CreateTable
CREATE TABLE "student_attendance" (
    "id" TEXT NOT NULL,
    "attendanceCode" TEXT NOT NULL,
    "studentAdmissionNo" TEXT,
    "studentName" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "section" TEXT,
    "attendanceDate" TIMESTAMP(3) NOT NULL,
    "status" "StudentAttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "checkInTime" TEXT,
    "checkOutTime" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_attendance_attendanceCode_key" ON "student_attendance"("attendanceCode");

-- CreateIndex
CREATE UNIQUE INDEX "student_attendance_studentAdmissionNo_attendanceDate_key" ON "student_attendance"("studentAdmissionNo", "attendanceDate");
