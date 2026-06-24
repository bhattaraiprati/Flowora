import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { ProjectMember } from '../models/projectMember.model';
import { OrganizationMember } from '../models/organizationMember.model';
import { Project } from '../models/project.model';
import { Task } from '../models/task.model';

@Module({
  imports: [
    SequelizeModule.forFeature([ProjectMember, OrganizationMember, Project, Task]),
  ],
  controllers: [MemberController],
  providers: [MemberService],
  exports: [MemberService],
})
export class MemberModule {}