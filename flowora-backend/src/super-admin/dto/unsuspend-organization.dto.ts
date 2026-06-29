import { IsOptional, IsString } from 'class-validator';

export class UnsuspendOrganizationDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
