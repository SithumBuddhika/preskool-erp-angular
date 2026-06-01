-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('ADMISSION', 'TUITION', 'EXAM', 'LIBRARY', 'TRANSPORT', 'ACTIVITY', 'OTHER');

-- CreateEnum
CREATE TYPE "FeePaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID');

-- CreateEnum
CREATE TYPE "FeePaymentMethod" AS ENUM ('CASH', 'CARD', 'BANK_TRANSFER', 'ONLINE', 'CHEQUE');

-- CreateTable
CREATE TABLE "fees" (
    "id" TEXT NOT NULL,
    "receiptNo" TEXT NOT NULL,
    "studentAdmissionNo" TEXT,
    "studentName" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "section" TEXT,
    "feeType" "FeeType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "paymentStatus" "FeePaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "FeePaymentMethod",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fees_receiptNo_key" ON "fees"("receiptNo");
