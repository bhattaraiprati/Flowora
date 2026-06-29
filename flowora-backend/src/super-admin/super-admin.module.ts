import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminService } from './super-admin.service';
import { Organization } from '../models/organization.model';
import { User } from '../models/user.model';
import { Project } from '../models/project.model';
import { Task } from '../models/task.model';
import { OrganizationMember } from '../models/organizationMember.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Organization,
      User,
      Project,
      Task,
      OrganizationMember,
    ]),
  ],
  controllers: [SuperAdminController],
  providers: [SuperAdminService],
  exports: [SuperAdminService],
})
export class SuperAdminModule {}
