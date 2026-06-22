import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RequestUser } from '../auth/strategies/jwt.strategy';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

interface RequestWithUser extends Request {
  user: RequestUser;
}

@Controller('api/projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post('organization/:organizationId')
  async createProject(
    @Req() req: RequestWithUser,
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectService.createProject(req.user.id, organizationId, dto);
  }

  @Get('organization/:organizationId')
  async getOrganizationProjects(
    @Req() req: RequestWithUser,
    @Param('organizationId') organizationId: string,
  ) {
    return this.projectService.getOrganizationProjects(req.user.id, organizationId);
  }

  @Get(':projectId')
  async getProject(@Req() req: RequestWithUser, @Param('projectId') projectId: string) {
    return this.projectService.getProjectById(req.user.id, projectId);
  }

  @Patch(':projectId')
  async updateProject(
    @Req() req: RequestWithUser,
    @Param('projectId') projectId: string,
    @Body() updates: UpdateProjectDto,
  ) {
    return this.projectService.updateProject(req.user.id, projectId, updates);
  }

  @Delete(':projectId')
  async deleteProject(@Req() req: RequestWithUser, @Param('projectId') projectId: string) {
    return this.projectService.deleteProject(req.user.id, projectId);
  }

  @Patch(':projectId/favorite')
  async toggleFavorite(@Req() req: RequestWithUser, @Param('projectId') projectId: string) {
    return this.projectService.toggleFavorite(req.user.id, projectId);
  }
}
