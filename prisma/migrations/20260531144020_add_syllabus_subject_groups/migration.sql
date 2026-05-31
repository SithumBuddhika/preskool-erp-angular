-- CreateEnum
CREATE TYPE "SyllabusSubjectGroupStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "syllabus_subject_groups" (
    "id" TEXT NOT NULL,
    "groupCode" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "classTeacher" TEXT,
    "subjectNames" TEXT[],
    "subjectCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "totalSubjects" INTEGER NOT NULL DEFAULT 0,
    "status" "SyllabusSubjectGroupStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "syllabus_subject_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "syllabus_subject_groups_groupCode_key" ON "syllabus_subject_groups"("groupCode");
