import { IsOptional, IsString } from 'class-validator';

export class ApproveOrganizationDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
