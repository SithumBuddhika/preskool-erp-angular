-- CreateEnum
CREATE TYPE "SubjectStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "subjectCode" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "className" TEXT,
    "teacherName" TEXT,
    "weeklyHours" INTEGER,
    "status" "SubjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subjects_subjectCode_key" ON "subjects"("subjectCode");
