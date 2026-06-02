-- CreateEnum
CREATE TYPE "TeacherAttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY');

-- CreateTable
CREATE TABLE "teacher_attendance" (
    "id" TEXT NOT NULL,
    "attendanceCode" TEXT NOT NULL,
    "teacherEmployeeNo" TEXT,
    "teacherName" TEXT NOT NULL,
    "subject" TEXT,
    "attendanceDate" TIMESTAMP(3) NOT NULL,
    "status" "TeacherAttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "checkInTime" TEXT,
    "checkOutTime" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teacher_attendance_attendanceCode_key" ON "teacher_attendance"("attendanceCode");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_attendance_teacherEmployeeNo_attendanceDate_key" ON "teacher_attendance"("teacherEmployeeNo", "attendanceDate");
