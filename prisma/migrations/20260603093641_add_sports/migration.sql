-- CreateEnum
CREATE TYPE "SportStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "sports" (
    "id" TEXT NOT NULL,
    "sportCode" TEXT NOT NULL,
    "sportName" TEXT NOT NULL,
    "category" TEXT,
    "coachName" TEXT,
    "venue" TEXT,
    "practiceDays" TEXT,
    "practiceTime" TEXT,
    "maxParticipants" INTEGER NOT NULL DEFAULT 0,
    "currentParticipants" INTEGER NOT NULL DEFAULT 0,
    "status" "SportStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sports_sportCode_key" ON "sports"("sportCode");
