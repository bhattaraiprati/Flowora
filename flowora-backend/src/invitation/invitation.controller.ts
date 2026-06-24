import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RequestUser } from '../auth/strategies/jwt.strategy';
import { InvitationService } from './invitation.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';

interface RequestWithUser extends Request {
  user: RequestUser;
}

@Controller('api/invitations')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createInvitation(@Req() req: RequestWithUser, @Body() dto: CreateInvitationDto) {
    return this.invitationService.createInvitation(req.user.id, dto);
  }

  @Get('token/:token')
  async getInvitationByToken(@Param('token') token: string) {
    return this.invitationService.getInvitationByToken(token);
  }

  @Post(':token/accept')
  @UseGuards(JwtAuthGuard)
  async acceptInvitation(@Req() req: RequestWithUser, @Param('token') token: string) {
    return this.invitationService.acceptInvitation(req.user.id, token);
  }

  @Get('organization/:organizationId')
  @UseGuards(JwtAuthGuard)
  async getOrganizationInvitations(
    @Req() req: RequestWithUser,
    @Param('organizationId') organizationId: string,
    @Query() filters: any,
  ) {
    return this.invitationService.getOrganizationInvitations(req.user.id, organizationId, filters);
  }

  @Get('project/:projectId')
  @UseGuards(JwtAuthGuard)
  async getProjectInvitations(
    @Req() req: RequestWithUser,
    @Param('projectId') projectId: string,
  ) {
    return this.invitationService.getProjectInvitations(req.user.id, projectId);
  }

  @Delete(':invitationId')
  @UseGuards(JwtAuthGuard)
  async revokeInvitation(@Req() req: RequestWithUser, @Param('invitationId') invitationId: string) {
    await this.invitationService.revokeInvitation(req.user.id, invitationId);
    return { message: 'Invitation revoked successfully' };
  }
}