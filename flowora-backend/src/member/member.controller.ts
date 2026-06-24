import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RequestUser } from '../auth/strategies/jwt.strategy';
import { MemberService } from './member.service';
import { UpdateProjectMemberRoleDto, UpdateOrgMemberRoleDto } from './dto/update-role.dto';

interface RequestWithUser extends Request {
  user: RequestUser;
}

@Controller('api/members')
@UseGuards(JwtAuthGuard)
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Get('project/:projectId')
  async getProjectMembers(@Req() req: RequestWithUser, @Param('projectId') projectId: string) {
    return this.memberService.getProjectMembers(req.user.id, projectId);
  }

  @Get('organization/:organizationId')
  async getOrganizationMembers(@Req() req: RequestWithUser, @Param('organizationId') organizationId: string) {
    return this.memberService.getOrganizationMembers(req.user.id, organizationId);
  }

  @Patch('project/:projectId/:memberId/role')
  async updateProjectMemberRole(
    @Req() req: RequestWithUser,
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateProjectMemberRoleDto,
  ) {
    return this.memberService.updateProjectMemberRole(req.user.id, projectId, memberId, dto.role);
  }

  @Patch('organization/:organizationId/:memberId/role')
  async updateOrganizationMemberRole(
    @Req() req: RequestWithUser,
    @Param('organizationId') organizationId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateOrgMemberRoleDto,
  ) {
    return this.memberService.updateOrganizationMemberRole(req.user.id, organizationId, memberId, dto.role);
  }

  @Delete('project/:projectId/:memberId')
  async removeProjectMember(
    @Req() req: RequestWithUser,
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
  ) {
    await this.memberService.removeProjectMember(req.user.id, projectId, memberId);
    return { message: 'Member removed successfully' };
  }

  @Delete('organization/:organizationId/:memberId')
  async removeOrganizationMember(
    @Req() req: RequestWithUser,
    @Param('organizationId') organizationId: string,
    @Param('memberId') memberId: string,
  ) {
    await this.memberService.removeOrganizationMember(req.user.id, organizationId, memberId);
    return { message: 'Member removed successfully' };
  }
}