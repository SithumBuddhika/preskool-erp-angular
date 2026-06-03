import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePayrollDto } from './dto/create-payroll.dto';
import { UpdatePayrollDto } from './dto/update-payroll.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.payroll.findMany({
      where: search
        ? {
            OR: [
              { payrollCode: { contains: search, mode: 'insensitive' } },
              { staffCode: { contains: search, mode: 'insensitive' } },
              { staffName: { contains: search, mode: 'insensitive' } },
              { department: { contains: search, mode: 'insensitive' } },
              { designation: { contains: search, mode: 'insensitive' } },
              { salaryMonth: { contains: search, mode: 'insensitive' } },
              { remarks: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id },
    });

    if (!payroll) {
      throw new NotFoundException('Payroll record not found');
    }

    return payroll;
  }

  async generateNextCode() {
    const records = await this.prisma.payroll.findMany({
      select: {
        payrollCode: true,
      },
    });

    const highestNumber = records.reduce((highest, record) => {
      const match = record.payrollCode.match(/\d+/);
      const codeNumber = match ? Number(match[0]) : 0;

      return codeNumber > highest ? codeNumber : highest;
    }, 0);

    return {
      payrollCode: `PAY-${String(highestNumber + 1).padStart(4, '0')}`,
    };
  }

  async create(createPayrollDto: CreatePayrollDto) {
    await this.validateUniquePayrollCode(createPayrollDto.payrollCode);

    await this.validateDuplicatePayroll(
      createPayrollDto.staffCode,
      createPayrollDto.salaryMonth,
    );

    const basicSalary = Number(createPayrollDto.basicSalary || 0);
    const allowance = Number(createPayrollDto.allowance || 0);
    const deduction = Number(createPayrollDto.deduction || 0);
    const netSalary = this.calculateNetSalary(
      basicSalary,
      allowance,
      deduction,
    );

    return this.prisma.payroll.create({
      data: {
        payrollCode: createPayrollDto.payrollCode.trim(),
        staffCode: createPayrollDto.staffCode?.trim() || null,
        staffName: createPayrollDto.staffName.trim(),
        department: createPayrollDto.department?.trim() || null,
        designation: createPayrollDto.designation?.trim() || null,
        salaryMonth: createPayrollDto.salaryMonth.trim(),
        basicSalary,
        allowance,
        deduction,
        netSalary,
        status: createPayrollDto.status || 'PENDING',
        paymentDate: createPayrollDto.paymentDate
          ? new Date(createPayrollDto.paymentDate)
          : null,
        remarks: createPayrollDto.remarks?.trim() || null,
      },
    });
  }

  async update(id: string, updatePayrollDto: UpdatePayrollDto) {
    const existingPayroll = await this.findOne(id);

    if (updatePayrollDto.payrollCode) {
      await this.validateUniquePayrollCode(updatePayrollDto.payrollCode, id);
    }

    const nextStaffCode =
      updatePayrollDto.staffCode ?? existingPayroll.staffCode ?? undefined;

    const nextSalaryMonth =
      updatePayrollDto.salaryMonth || existingPayroll.salaryMonth;

    await this.validateDuplicatePayroll(nextStaffCode, nextSalaryMonth, id);

    const basicSalary =
      updatePayrollDto.basicSalary !== undefined
        ? Number(updatePayrollDto.basicSalary)
        : existingPayroll.basicSalary;

    const allowance =
      updatePayrollDto.allowance !== undefined
        ? Number(updatePayrollDto.allowance)
        : existingPayroll.allowance;

    const deduction =
      updatePayrollDto.deduction !== undefined
        ? Number(updatePayrollDto.deduction)
        : existingPayroll.deduction;

    const netSalary = this.calculateNetSalary(
      basicSalary,
      allowance,
      deduction,
    );

    return this.prisma.payroll.update({
      where: { id },
      data: {
        payrollCode: updatePayrollDto.payrollCode?.trim(),
        staffCode:
          updatePayrollDto.staffCode !== undefined
            ? updatePayrollDto.staffCode?.trim() || null
            : undefined,
        staffName: updatePayrollDto.staffName?.trim(),
        department:
          updatePayrollDto.department !== undefined
            ? updatePayrollDto.department?.trim() || null
            : undefined,
        designation:
          updatePayrollDto.designation !== undefined
            ? updatePayrollDto.designation?.trim() || null
            : undefined,
        salaryMonth: updatePayrollDto.salaryMonth?.trim(),
        basicSalary,
        allowance,
        deduction,
        netSalary,
        status: updatePayrollDto.status,
        paymentDate:
          updatePayrollDto.paymentDate !== undefined
            ? updatePayrollDto.paymentDate
              ? new Date(updatePayrollDto.paymentDate)
              : null
            : undefined,
        remarks:
          updatePayrollDto.remarks !== undefined
            ? updatePayrollDto.remarks?.trim() || null
            : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.payroll.delete({
      where: { id },
    });

    return {
      message: 'Payroll record deleted successfully',
    };
  }

  private calculateNetSalary(
    basicSalary: number,
    allowance: number,
    deduction: number,
  ) {
    const netSalary = basicSalary + allowance - deduction;

    return netSalary < 0 ? 0 : netSalary;
  }

  private async validateUniquePayrollCode(
    payrollCode: string,
    ignorePayrollId?: string,
  ) {
    const existingPayroll = await this.prisma.payroll.findUnique({
      where: {
        payrollCode: payrollCode.trim(),
      },
    });

    if (existingPayroll && existingPayroll.id !== ignorePayrollId) {
      throw new BadRequestException('Payroll ID already exists');
    }
  }

  private async validateDuplicatePayroll(
    staffCode?: string | null,
    salaryMonth?: string,
    ignorePayrollId?: string,
  ) {
    if (!staffCode || !salaryMonth) {
      return;
    }

    const existingPayroll = await this.prisma.payroll.findFirst({
      where: {
        staffCode: staffCode.trim(),
        salaryMonth: salaryMonth.trim(),
        NOT: ignorePayrollId
          ? {
              id: ignorePayrollId,
            }
          : undefined,
      },
    });

    if (existingPayroll) {
      throw new BadRequestException(
        'Payroll for this staff member already exists for this salary month',
      );
    }
  }
}
