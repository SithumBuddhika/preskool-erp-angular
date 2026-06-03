import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { TransportRouteStatus } from '../../../../generated/prisma/enums';

export type TransportRoutePointDto = {
  label?: string;
  lat: number;
  lng: number;
};

export class CreateTransportRouteDto {
  @IsString()
  @IsNotEmpty()
  routeCode!: string;

  @IsString()
  @IsNotEmpty()
  routeName!: string;

  @IsString()
  @IsNotEmpty()
  startLocation!: string;

  @IsString()
  @IsNotEmpty()
  endLocation!: string;

  @IsOptional()
  @IsArray()
  stops?: string[];

  @IsOptional()
  @IsArray()
  routePoints?: TransportRoutePointDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  distanceKm?: number;

  @IsOptional()
  @IsString()
  estimatedTime?: string;

  @IsOptional()
  @IsString()
  vehicleNo?: string;

  @IsOptional()
  @IsString()
  driverName?: string;

  @IsOptional()
  @IsEnum(TransportRouteStatus)
  status?: TransportRouteStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
