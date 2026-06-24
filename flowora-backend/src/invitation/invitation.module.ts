import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { InvitationController } from './invitation.controller';
import { InvitationService } from './invitation.service';
import { RedisInvitationService } from './redis-invitation.service';
import { Invitation } from '../models/invitation.model';
import { Organization } from '../models/organization.model';
import { Project } from '../models/project.model';
import { ProjectMember } from '../models/projectMember.model';
import { OrganizationMember } from '../models/organizationMember.model';
import { User } from '../models/user.model';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Invitation,
      Organization,
      Project,
      ProjectMember,
      OrganizationMember,
      User,
    ]),
    MailModule,
  ],
  controllers: [InvitationController],
  providers: [InvitationService, RedisInvitationService],
  exports: [InvitationService, RedisInvitationService],
})
export class InvitationModule {}