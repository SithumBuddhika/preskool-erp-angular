import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { TransportRouteStatus } from '../../../../generated/prisma/enums';
import { TransportRoutePointDto } from './create-transport-route.dto';

export class UpdateTransportRouteDto {
  @IsOptional()
  @IsString()
  routeCode?: string;

  @IsOptional()
  @IsString()
  routeName?: string;

  @IsOptional()
  @IsString()
  startLocation?: string;

  @IsOptional()
  @IsString()
  endLocation?: string;

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
