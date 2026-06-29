import { IsNotEmpty, IsString } from 'class-validator';

export class RejectOrganizationDto {
  @IsNotEmpty()
  @IsString()
  reason: string;
}
