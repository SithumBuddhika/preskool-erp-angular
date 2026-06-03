import { IsBoolean } from 'class-validator';

export class UpdateAdminStatusDto {
  @IsBoolean()
  isActive!: boolean;
}
