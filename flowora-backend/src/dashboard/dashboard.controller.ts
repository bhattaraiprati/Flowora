// dashboard.controller.ts
import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RequestUser } from '../auth/strategies/jwt.strategy';
import { DashboardService } from './dashboard.service';

interface RequestWithUser extends Request {
  user: RequestUser;
}

@Controller('api/dashboard')
@UseGuards(JwtAuthGuard)   
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}  

  @Get(':organizationId')
  async getUserDashboard(
    @Req() req: RequestWithUser,
    @Param('organizationId') organizationId: string,
  ) {
    return this.dashboardService.getUserDashboard(req.user.id, organizationId);
  }
}