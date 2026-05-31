-- CreateEnum
CREATE TYPE "TimeTableStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "time_tables" (
    "id" TEXT NOT NULL,
    "timeTableCode" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "teacherName" TEXT NOT NULL,
    "roomNo" TEXT NOT NULL,
    "day" "RoutineDay" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "status" "TimeTableStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_tables_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "time_tables_timeTableCode_key" ON "time_tables"("timeTableCode");
