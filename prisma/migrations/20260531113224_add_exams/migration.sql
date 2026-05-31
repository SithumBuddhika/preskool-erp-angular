-- CreateEnum
CREATE TYPE "ExamStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "exams" (
    "id" TEXT NOT NULL,
    "examCode" TEXT NOT NULL,
    "examName" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "teacherName" TEXT NOT NULL,
    "roomNo" TEXT NOT NULL,
    "examDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "maxMarks" INTEGER NOT NULL,
    "minMarks" INTEGER NOT NULL,
    "status" "ExamStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exams_examCode_key" ON "exams"("examCode");
