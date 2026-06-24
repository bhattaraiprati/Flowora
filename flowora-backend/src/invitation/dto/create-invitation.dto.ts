import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { InvitationScope, OrgMemberRole, ProjectMemberRole } from '../../common/enums';

export class CreateInvitationDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsEnum(InvitationScope)
  @IsNotEmpty()
  scope: InvitationScope;

  @IsString()
  @IsNotEmpty()
  organization_id: string;

  @IsString()
  @IsOptional()
  project_id?: string;
}