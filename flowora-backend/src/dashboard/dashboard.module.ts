// dashboard.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Project } from '../models/project.model';
import { Task } from '../models/task.model';
import { ProjectMember } from '../models/projectMember.model';
import { OrganizationMember } from '../models/organizationMember.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Project, Task, ProjectMember, OrganizationMember]), 
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}