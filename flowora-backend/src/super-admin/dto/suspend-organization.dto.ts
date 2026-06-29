import { IsNotEmpty, IsString } from 'class-validator';

export class SuspendOrganizationDto {
  @IsNotEmpty()
  @IsString()
  reason: string;
}
