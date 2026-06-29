import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { SuperAdminService } from './super-admin.service';
import { ApproveOrganizationDto } from './dto/approve-organization.dto';
import { RejectOrganizationDto } from './dto/reject-organization.dto';
import { SuspendOrganizationDto } from './dto/suspend-organization.dto';
import { UnsuspendOrganizationDto } from './dto/unsuspend-organization.dto';
import { RequestUser } from '../auth/strategies/jwt.strategy';

interface RequestWithUser extends Request {
  user: RequestUser;
}

@Controller('api/super-admin')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('stats')
  async getStats() {
    return this.superAdminService.getStats();
  }

  @Get('organizations')
  async getOrganizations(
    @Query('status', new DefaultValuePipe('all')) status: string,
    @Query('search', new DefaultValuePipe('')) search: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.superAdminService.getOrganizations(status, search, page, limit);
  }

  @Get('organizations/:organizationId')
  async getOrganizationDetails(@Param('organizationId') organizationId: string) {
    return this.superAdminService.getOrganizationDetails(organizationId);
  }

  @Post('organizations/:organizationId/approve')
  async approveOrganization(
    @Param('organizationId') organizationId: string,
    @Body() body: ApproveOrganizationDto,
    @Req() req: RequestWithUser,
  ) {
    return this.superAdminService.approveOrganization(
      organizationId,
      req.user.id,
      body.notes,
    );
  }

  @Post('organizations/:organizationId/reject')
  async rejectOrganization(
    @Param('organizationId') organizationId: string,
    @Body() body: RejectOrganizationDto,
  ) {
    return this.superAdminService.rejectOrganization(organizationId, body.reason);
  }

  @Post('organizations/:organizationId/suspend')
  async suspendOrganization(
    @Param('organizationId') organizationId: string,
    @Body() body: SuspendOrganizationDto,
  ) {
    return this.superAdminService.suspendOrganization(organizationId, body.reason);
  }

  @Post('organizations/:organizationId/unsuspend')
  async unsuspendOrganization(
    @Param('organizationId') organizationId: string,
    @Body() body: UnsuspendOrganizationDto,
  ) {
    return this.superAdminService.unsuspendOrganization(organizationId, body.notes);
  }

  @Get('activity')
  async getPlatformActivity(
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number,
  ) {
    return this.superAdminService.getPlatformActivity(Math.min(days, 90));
  }

  @Get('pending-approvals')
  async getPendingApprovals() {
    return this.superAdminService.getPendingApprovals();
  }
}
