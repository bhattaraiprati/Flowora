import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { Task } from '../models/task.model';
import { Project } from '../models/project.model';
import { ProjectMember } from '../models/projectMember.model';
import { OrganizationMember } from '../models/organizationMember.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Task, Project, ProjectMember, OrganizationMember]),
  ],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}