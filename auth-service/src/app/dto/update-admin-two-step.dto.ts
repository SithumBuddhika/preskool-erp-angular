import { IsBoolean } from 'class-validator';

export class UpdateAdminTwoStepDto {
  @IsBoolean()
  twoStepEnabled!: boolean;
}
