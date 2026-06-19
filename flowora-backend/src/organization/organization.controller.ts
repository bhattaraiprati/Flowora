import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RequestUser } from '../auth/strategies/jwt.strategy';
import { OrganizationService } from './organization.service';

interface RequestWithUser extends Request {
  user: RequestUser;
}

@Controller('api/organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  async createOrganization(
    @Req() req: RequestWithUser,
    @Body()
    body: {
      name: string;
      slug: string;
      industry: string;
      size: string;
      website: string;
      description: string;
    },
  ) {
    return this.organizationService.createOrganization(req.user.id, body);
  }

  @Get('my')
  async getMyOrganizations(@Req() req: RequestWithUser) {
    return this.organizationService.getUserOrganizations(req.user.id);
  }
}
