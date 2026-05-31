import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateClassRoomDto } from './dto/create-class-room.dto';
import { UpdateClassRoomDto } from './dto/update-class-room.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class ClassRoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.classRoom.findMany({
      where: search
        ? {
            OR: [
              { roomNo: { contains: search, mode: 'insensitive' } },
              { roomName: { contains: search, mode: 'insensitive' } },
              { building: { contains: search, mode: 'insensitive' } },
              { floor: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const classRoom = await this.prisma.classRoom.findUnique({
      where: { id },
    });

    if (!classRoom) {
      throw new NotFoundException('Class room not found');
    }

    return classRoom;
  }

  async create(createClassRoomDto: CreateClassRoomDto) {
    await this.validateUniqueRoomNo(createClassRoomDto.roomNo);

    return this.prisma.classRoom.create({
      data: {
        roomNo: createClassRoomDto.roomNo.trim(),
        roomName: createClassRoomDto.roomName.trim(),
        building: createClassRoomDto.building?.trim() || null,
        floor: createClassRoomDto.floor?.trim() || null,
        capacity: createClassRoomDto.capacity ?? null,
        status: createClassRoomDto.status || 'ACTIVE',
      },
    });
  }

  async update(id: string, updateClassRoomDto: UpdateClassRoomDto) {
    await this.findOne(id);

    if (updateClassRoomDto.roomNo) {
      await this.validateUniqueRoomNo(updateClassRoomDto.roomNo, id);
    }

    return this.prisma.classRoom.update({
      where: { id },
      data: {
        roomNo: updateClassRoomDto.roomNo?.trim(),
        roomName: updateClassRoomDto.roomName?.trim(),
        building: updateClassRoomDto.building?.trim(),
        floor: updateClassRoomDto.floor?.trim(),
        capacity: updateClassRoomDto.capacity,
        status: updateClassRoomDto.status,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.classRoom.delete({
      where: { id },
    });

    return {
      message: 'Class room deleted successfully',
    };
  }

  private async validateUniqueRoomNo(roomNo: string, ignoreRoomId?: string) {
    const existingRoom = await this.prisma.classRoom.findUnique({
      where: {
        roomNo: roomNo.trim(),
      },
    });

    if (existingRoom && existingRoom.id !== ignoreRoomId) {
      throw new BadRequestException('Room number already exists');
    }
  }
}
