-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- CreateTable
CREATE TABLE "payrolls" (
    "id" TEXT NOT NULL,
    "payrollCode" TEXT NOT NULL,
    "staffCode" TEXT,
    "staffName" TEXT NOT NULL,
    "department" TEXT,
    "designation" TEXT,
    "salaryMonth" TEXT NOT NULL,
    "basicSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "allowance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "PayrollStatus" NOT NULL DEFAULT 'PENDING',
    "paymentDate" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payrolls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payrolls_payrollCode_key" ON "payrolls"("payrollCode");

-- CreateIndex
CREATE UNIQUE INDEX "payrolls_staffCode_salaryMonth_key" ON "payrolls"("staffCode", "salaryMonth");
