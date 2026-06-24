import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrgMemberRole, ProjectMemberRole } from '../../common/enums';

export class UpdateProjectMemberRoleDto {
  @IsEnum(ProjectMemberRole)
  @IsNotEmpty()
  role: ProjectMemberRole;
}

export class UpdateOrgMemberRoleDto {
  @IsEnum(OrgMemberRole)
  @IsNotEmpty()
  role: OrgMemberRole;
}