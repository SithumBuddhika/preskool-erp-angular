-- CreateEnum
CREATE TYPE "LibraryMemberType" AS ENUM ('STUDENT', 'TEACHER', 'STAFF');

-- CreateEnum
CREATE TYPE "LibraryMemberStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateTable
CREATE TABLE "library_members" (
    "id" TEXT NOT NULL,
    "memberCode" TEXT NOT NULL,
    "memberType" "LibraryMemberType" NOT NULL,
    "referenceCode" TEXT,
    "memberName" TEXT NOT NULL,
    "className" TEXT,
    "department" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "joinDate" TIMESTAMP(3) NOT NULL,
    "status" "LibraryMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "library_members_memberCode_key" ON "library_members"("memberCode");

-- CreateIndex
CREATE UNIQUE INDEX "library_members_memberType_referenceCode_key" ON "library_members"("memberType", "referenceCode");
