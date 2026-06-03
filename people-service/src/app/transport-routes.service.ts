import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTransportRouteDto } from './dto/create-transport-route.dto';
import { UpdateTransportRouteDto } from './dto/update-transport-route.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class TransportRoutesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    const keyword = search?.trim();

    return this.prisma.transportRoute.findMany({
      where: keyword
        ? {
            OR: [
              { routeCode: { contains: keyword, mode: 'insensitive' } },
              { routeName: { contains: keyword, mode: 'insensitive' } },
              { startLocation: { contains: keyword, mode: 'insensitive' } },
              { endLocation: { contains: keyword, mode: 'insensitive' } },
              { estimatedTime: { contains: keyword, mode: 'insensitive' } },
              { vehicleNo: { contains: keyword, mode: 'insensitive' } },
              { driverName: { contains: keyword, mode: 'insensitive' } },
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
    const route = await this.prisma.transportRoute.findUnique({
      where: { id },
    });

    if (!route) {
      throw new NotFoundException('Transport route not found');
    }

    return route;
  }

  async generateNextCode() {
    const routes = await this.prisma.transportRoute.findMany({
      select: {
        routeCode: true,
      },
    });

    const highestNumber = routes.reduce((highest, route) => {
      const match = route.routeCode.match(/^RTE-(\d+)$/);
      const codeNumber = match ? Number(match[1]) : 0;

      return codeNumber > highest ? codeNumber : highest;
    }, 0);

    return {
      routeCode: `RTE-${String(highestNumber + 1).padStart(4, '0')}`,
    };
  }

  async create(createTransportRouteDto: CreateTransportRouteDto) {
    const routeCode = createTransportRouteDto.routeCode.trim();

    await this.validateUniqueRouteCode(routeCode);

    return this.prisma.transportRoute.create({
      data: {
        routeCode,
        routeName: createTransportRouteDto.routeName.trim(),
        startLocation: createTransportRouteDto.startLocation.trim(),
        endLocation: createTransportRouteDto.endLocation.trim(),
        stops: this.normalizeJsonArray(createTransportRouteDto.stops),
        routePoints: this.normalizeJsonArray(
          createTransportRouteDto.routePoints,
        ),
        distanceKm: createTransportRouteDto.distanceKm ?? null,
        estimatedTime: this.emptyToNull(createTransportRouteDto.estimatedTime),
        vehicleNo: this.emptyToNull(createTransportRouteDto.vehicleNo),
        driverName: this.emptyToNull(createTransportRouteDto.driverName),
        status: createTransportRouteDto.status || 'ACTIVE',
        notes: this.emptyToNull(createTransportRouteDto.notes),
      },
    });
  }

  async update(id: string, updateTransportRouteDto: UpdateTransportRouteDto) {
    await this.findOne(id);

    if (updateTransportRouteDto.routeCode !== undefined) {
      await this.validateUniqueRouteCode(updateTransportRouteDto.routeCode, id);
    }

    return this.prisma.transportRoute.update({
      where: { id },
      data: {
        routeCode:
          updateTransportRouteDto.routeCode !== undefined
            ? updateTransportRouteDto.routeCode.trim()
            : undefined,

        routeName:
          updateTransportRouteDto.routeName !== undefined
            ? updateTransportRouteDto.routeName.trim()
            : undefined,

        startLocation:
          updateTransportRouteDto.startLocation !== undefined
            ? updateTransportRouteDto.startLocation.trim()
            : undefined,

        endLocation:
          updateTransportRouteDto.endLocation !== undefined
            ? updateTransportRouteDto.endLocation.trim()
            : undefined,

        stops:
          updateTransportRouteDto.stops !== undefined
            ? this.normalizeJsonArray(updateTransportRouteDto.stops)
            : undefined,

        routePoints:
          updateTransportRouteDto.routePoints !== undefined
            ? this.normalizeJsonArray(updateTransportRouteDto.routePoints)
            : undefined,

        distanceKm:
          updateTransportRouteDto.distanceKm !== undefined
            ? updateTransportRouteDto.distanceKm
            : undefined,

        estimatedTime:
          updateTransportRouteDto.estimatedTime !== undefined
            ? this.emptyToNull(updateTransportRouteDto.estimatedTime)
            : undefined,

        vehicleNo:
          updateTransportRouteDto.vehicleNo !== undefined
            ? this.emptyToNull(updateTransportRouteDto.vehicleNo)
            : undefined,

        driverName:
          updateTransportRouteDto.driverName !== undefined
            ? this.emptyToNull(updateTransportRouteDto.driverName)
            : undefined,

        status: updateTransportRouteDto.status,

        notes:
          updateTransportRouteDto.notes !== undefined
            ? this.emptyToNull(updateTransportRouteDto.notes)
            : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.transportRoute.delete({
      where: { id },
    });

    return {
      message: 'Transport route deleted successfully',
    };
  }

  private async validateUniqueRouteCode(
    routeCode: string,
    ignoreRouteId?: string,
  ) {
    const existingRoute = await this.prisma.transportRoute.findUnique({
      where: {
        routeCode: routeCode.trim(),
      },
    });

    if (existingRoute && existingRoute.id !== ignoreRouteId) {
      throw new BadRequestException('Route code already exists');
    }
  }

  private emptyToNull(value?: string | null): string | null {
    const cleanedValue = value?.trim();

    return cleanedValue ? cleanedValue : null;
  }

  private normalizeJsonArray<T>(value?: T[] | null): T[] | null {
    if (!value || !Array.isArray(value) || value.length === 0) {
      return null;
    }

    return value;
  }
}
