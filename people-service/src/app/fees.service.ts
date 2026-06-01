import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FeePaymentStatus } from '../../../generated/prisma/enums';
import { CreateFeeDto } from './dto/create-fee.dto';
import { UpdateFeeDto } from './dto/update-fee.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class FeesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.fee.findMany({
      where: search
        ? {
            OR: [
              { receiptNo: { contains: search, mode: 'insensitive' } },
              { studentAdmissionNo: { contains: search, mode: 'insensitive' } },
              { studentName: { contains: search, mode: 'insensitive' } },
              { className: { contains: search, mode: 'insensitive' } },
              { section: { contains: search, mode: 'insensitive' } },
              { notes: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const fee = await this.prisma.fee.findUnique({
      where: { id },
    });

    if (!fee) {
      throw new NotFoundException('Fee record not found');
    }

    return fee;
  }

  async generateNextCode() {
    const fees = await this.prisma.fee.findMany({
      select: {
        receiptNo: true,
      },
    });

    const highestNumber = fees.reduce((highest, fee) => {
      const match = fee.receiptNo.match(/\d+/);
      const codeNumber = match ? Number(match[0]) : 0;

      return codeNumber > highest ? codeNumber : highest;
    }, 0);

    return {
      receiptNo: `FEE-${String(highestNumber + 1).padStart(4, '0')}`,
    };
  }

  async create(createFeeDto: CreateFeeDto) {
    await this.validateUniqueReceiptNo(createFeeDto.receiptNo);

    const paidAmount = createFeeDto.paidAmount ?? 0;
    const balance = this.calculateBalance(createFeeDto.amount, paidAmount);
    const paymentStatus =
      createFeeDto.paymentStatus ||
      this.calculatePaymentStatus(createFeeDto.amount, paidAmount);

    return this.prisma.fee.create({
      data: {
        receiptNo: createFeeDto.receiptNo.trim(),
        studentAdmissionNo: createFeeDto.studentAdmissionNo?.trim() || null,
        studentName: createFeeDto.studentName.trim(),
        className: createFeeDto.className.trim(),
        section: createFeeDto.section?.trim() || null,
        feeType: createFeeDto.feeType,
        amount: createFeeDto.amount,
        paidAmount,
        balance,
        dueDate: createFeeDto.dueDate ? new Date(createFeeDto.dueDate) : null,
        paidDate: createFeeDto.paidDate
          ? new Date(createFeeDto.paidDate)
          : null,
        paymentStatus,
        paymentMethod: createFeeDto.paymentMethod || null,
        notes: createFeeDto.notes?.trim() || null,
      },
    });
  }

  async update(id: string, updateFeeDto: UpdateFeeDto) {
    const existingFee = await this.findOne(id);

    if (updateFeeDto.receiptNo) {
      await this.validateUniqueReceiptNo(updateFeeDto.receiptNo, id);
    }

    const nextAmount = updateFeeDto.amount ?? existingFee.amount;
    const nextPaidAmount = updateFeeDto.paidAmount ?? existingFee.paidAmount;
    const nextBalance = this.calculateBalance(nextAmount, nextPaidAmount);
    const nextPaymentStatus =
      updateFeeDto.paymentStatus ||
      this.calculatePaymentStatus(nextAmount, nextPaidAmount);

    return this.prisma.fee.update({
      where: { id },
      data: {
        receiptNo: updateFeeDto.receiptNo?.trim(),
        studentAdmissionNo:
          updateFeeDto.studentAdmissionNo !== undefined
            ? updateFeeDto.studentAdmissionNo?.trim() || null
            : undefined,
        studentName: updateFeeDto.studentName?.trim(),
        className: updateFeeDto.className?.trim(),
        section:
          updateFeeDto.section !== undefined
            ? updateFeeDto.section?.trim() || null
            : undefined,
        feeType: updateFeeDto.feeType,
        amount: updateFeeDto.amount,
        paidAmount: updateFeeDto.paidAmount,
        balance: nextBalance,
        dueDate:
          updateFeeDto.dueDate !== undefined
            ? updateFeeDto.dueDate
              ? new Date(updateFeeDto.dueDate)
              : null
            : undefined,
        paidDate:
          updateFeeDto.paidDate !== undefined
            ? updateFeeDto.paidDate
              ? new Date(updateFeeDto.paidDate)
              : null
            : undefined,
        paymentStatus: nextPaymentStatus,
        paymentMethod:
          updateFeeDto.paymentMethod !== undefined
            ? updateFeeDto.paymentMethod || null
            : undefined,
        notes:
          updateFeeDto.notes !== undefined
            ? updateFeeDto.notes?.trim() || null
            : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.fee.delete({
      where: { id },
    });

    return {
      message: 'Fee record deleted successfully',
    };
  }

  private calculateBalance(amount: number, paidAmount: number) {
    return Math.max(amount - paidAmount, 0);
  }

  private calculatePaymentStatus(
    amount: number,
    paidAmount: number,
  ): FeePaymentStatus {
    if (paidAmount >= amount) {
      return 'PAID';
    }

    if (paidAmount > 0) {
      return 'PARTIAL';
    }

    return 'PENDING';
  }

  private async validateUniqueReceiptNo(
    receiptNo: string,
    ignoreFeeId?: string,
  ) {
    const existingFee = await this.prisma.fee.findUnique({
      where: {
        receiptNo: receiptNo.trim(),
      },
    });

    if (existingFee && existingFee.id !== ignoreFeeId) {
      throw new BadRequestException('Receipt ID already exists');
    }
  }
}
