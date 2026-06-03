-- CreateEnum
CREATE TYPE "SchoolEventType" AS ENUM ('MEETING', 'HOLIDAY_EVENT', 'EXAM_EVENT', 'SPORTS_EVENT', 'GENERAL');

-- CreateEnum
CREATE TYPE "SchoolEventAudience" AS ENUM ('ALL', 'STUDENTS', 'TEACHERS', 'STAFF', 'PARENTS');

-- CreateEnum
CREATE TYPE "SchoolEventStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "school_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "eventType" "SchoolEventType" NOT NULL DEFAULT 'GENERAL',
    "audience" "SchoolEventAudience" NOT NULL DEFAULT 'ALL',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "startTime" TEXT,
    "endTime" TEXT,
    "location" TEXT,
    "organizer" TEXT,
    "description" TEXT,
    "status" "SchoolEventStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_events_pkey" PRIMARY KEY ("id")
);
