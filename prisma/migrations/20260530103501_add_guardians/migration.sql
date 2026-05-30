-- CreateEnum
CREATE TYPE "GuardianRelation" AS ENUM ('UNCLE', 'AUNT', 'GRANDFATHER', 'GRANDMOTHER', 'BROTHER', 'SISTER', 'OTHER');

-- CreateEnum
CREATE TYPE "GuardianStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "guardians" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "relation" "GuardianRelation" NOT NULL,
    "occupation" TEXT,
    "address" TEXT,
    "status" "GuardianStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guardians_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guardians_email_key" ON "guardians"("email");
