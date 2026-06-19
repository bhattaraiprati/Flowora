import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { Organization } from '../models/organization.model';
import { OrganizationMember } from '../models/organizationMember.model';
import { User } from '../models/user.model';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Organization, OrganizationMember, User]),
    AuthModule,
  ],
  controllers: [OrganizationController],
  providers: [OrganizationService],
  exports: [OrganizationService],
})
export class OrganizationModule {}
