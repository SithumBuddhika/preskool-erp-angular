import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LibraryMemberType } from '../../../generated/prisma/enums';
import { CreateLibraryMemberDto } from './dto/create-library-member.dto';
import { UpdateLibraryMemberDto } from './dto/update-library-member.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class LibraryMembersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    const keyword = search?.trim();

    return this.prisma.libraryMember.findMany({
      where: keyword
        ? {
            OR: [
              { memberCode: { contains: keyword, mode: 'insensitive' } },
              { referenceCode: { contains: keyword, mode: 'insensitive' } },
              { memberName: { contains: keyword, mode: 'insensitive' } },
              { className: { contains: keyword, mode: 'insensitive' } },
              { department: { contains: keyword, mode: 'insensitive' } },
              { phone: { contains: keyword, mode: 'insensitive' } },
              { email: { contains: keyword, mode: 'insensitive' } },
              { notes: { contains: keyword, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const libraryMember = await this.prisma.libraryMember.findUnique({
      where: { id },
    });

    if (!libraryMember) {
      throw new NotFoundException('Library member not found');
    }

    return libraryMember;
  }

  async generateNextCode() {
    const records = await this.prisma.libraryMember.findMany({
      select: {
        memberCode: true,
      },
    });

    const highestNumber = records.reduce((highest, record) => {
      const match = record.memberCode.match(/^LM-(\d+)$/);
      const codeNumber = match ? Number(match[1]) : 0;

      return codeNumber > highest ? codeNumber : highest;
    }, 0);

    return {
      memberCode: `LM-${String(highestNumber + 1).padStart(4, '0')}`,
    };
  }

  async create(createLibraryMemberDto: CreateLibraryMemberDto) {
    const memberCode = createLibraryMemberDto.memberCode.trim();

    await this.validateUniqueMemberCode(memberCode);

    await this.validateDuplicateReference(
      createLibraryMemberDto.memberType,
      createLibraryMemberDto.referenceCode,
    );

    return this.prisma.libraryMember.create({
      data: {
        memberCode,
        memberType: createLibraryMemberDto.memberType,
        referenceCode: this.emptyToNull(createLibraryMemberDto.referenceCode),
        memberName: createLibraryMemberDto.memberName.trim(),
        className: this.emptyToNull(createLibraryMemberDto.className),
        department: this.emptyToNull(createLibraryMemberDto.department),
        phone: this.emptyToNull(createLibraryMemberDto.phone),
        email: this.normalizeEmail(createLibraryMemberDto.email),
        joinDate: new Date(createLibraryMemberDto.joinDate),
        status: createLibraryMemberDto.status || 'ACTIVE',
        notes: this.emptyToNull(createLibraryMemberDto.notes),
      },
    });
  }

  async update(id: string, updateLibraryMemberDto: UpdateLibraryMemberDto) {
    const existingMember = await this.findOne(id);

    if (updateLibraryMemberDto.memberCode !== undefined) {
      await this.validateUniqueMemberCode(
        updateLibraryMemberDto.memberCode,
        id,
      );
    }

    const nextMemberType =
      updateLibraryMemberDto.memberType || existingMember.memberType;

    const nextReferenceCode =
      updateLibraryMemberDto.referenceCode !== undefined
        ? updateLibraryMemberDto.referenceCode
        : existingMember.referenceCode;

    await this.validateDuplicateReference(
      nextMemberType,
      nextReferenceCode,
      id,
    );

    return this.prisma.libraryMember.update({
      where: { id },
      data: {
        memberCode:
          updateLibraryMemberDto.memberCode !== undefined
            ? updateLibraryMemberDto.memberCode.trim()
            : undefined,

        memberType: updateLibraryMemberDto.memberType,

        referenceCode:
          updateLibraryMemberDto.referenceCode !== undefined
            ? this.emptyToNull(updateLibraryMemberDto.referenceCode)
            : undefined,

        memberName:
          updateLibraryMemberDto.memberName !== undefined
            ? updateLibraryMemberDto.memberName.trim()
            : undefined,

        className:
          updateLibraryMemberDto.className !== undefined
            ? this.emptyToNull(updateLibraryMemberDto.className)
            : undefined,

        department:
          updateLibraryMemberDto.department !== undefined
            ? this.emptyToNull(updateLibraryMemberDto.department)
            : undefined,

        phone:
          updateLibraryMemberDto.phone !== undefined
            ? this.emptyToNull(updateLibraryMemberDto.phone)
            : undefined,

        email:
          updateLibraryMemberDto.email !== undefined
            ? this.normalizeEmail(updateLibraryMemberDto.email)
            : undefined,

        joinDate:
          updateLibraryMemberDto.joinDate !== undefined
            ? new Date(updateLibraryMemberDto.joinDate)
            : undefined,

        status: updateLibraryMemberDto.status,

        notes:
          updateLibraryMemberDto.notes !== undefined
            ? this.emptyToNull(updateLibraryMemberDto.notes)
            : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.libraryMember.delete({
      where: { id },
    });

    return {
      message: 'Library member deleted successfully',
    };
  }

  private async validateUniqueMemberCode(
    memberCode: string,
    ignoreMemberId?: string,
  ) {
    const existingMember = await this.prisma.libraryMember.findUnique({
      where: {
        memberCode: memberCode.trim(),
      },
    });

    if (existingMember && existingMember.id !== ignoreMemberId) {
      throw new BadRequestException('Library member code already exists');
    }
  }

  private async validateDuplicateReference(
    memberType: LibraryMemberType,
    referenceCode?: string | null,
    ignoreMemberId?: string,
  ) {
    const cleanedReferenceCode = referenceCode?.trim();

    if (!cleanedReferenceCode) {
      return;
    }

    const existingMember = await this.prisma.libraryMember.findFirst({
      where: {
        memberType,
        referenceCode: cleanedReferenceCode,
      },
    });

    if (existingMember && existingMember.id !== ignoreMemberId) {
      throw new BadRequestException(
        'This person is already registered as a library member',
      );
    }
  }

  private emptyToNull(value?: string | null): string | null {
    const cleanedValue = value?.trim();

    return cleanedValue ? cleanedValue : null;
  }

  private normalizeEmail(value?: string | null): string | null {
    const cleanedValue = value?.trim().toLowerCase();

    return cleanedValue ? cleanedValue : null;
  }
}
