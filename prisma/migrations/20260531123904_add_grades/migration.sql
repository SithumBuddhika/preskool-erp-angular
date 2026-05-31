-- CreateEnum
CREATE TYPE "GradeResult" AS ENUM ('PASS', 'FAIL');

-- CreateEnum
CREATE TYPE "GradeStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "grades" (
    "id" TEXT NOT NULL,
    "gradeCode" TEXT NOT NULL,
    "examCode" TEXT NOT NULL,
    "examName" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "teacherName" TEXT NOT NULL,
    "admissionNo" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "marksObtained" INTEGER NOT NULL,
    "maxMarks" INTEGER NOT NULL,
    "minMarks" INTEGER NOT NULL,
    "result" "GradeResult" NOT NULL,
    "gradeLetter" TEXT NOT NULL,
    "status" "GradeStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "grades_gradeCode_key" ON "grades"("gradeCode");

-- CreateIndex
CREATE UNIQUE INDEX "grades_examCode_admissionNo_key" ON "grades"("examCode", "admissionNo");
