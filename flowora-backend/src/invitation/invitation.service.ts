import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { Invitation } from '../models/invitation.model';
import { Organization } from '../models/organization.model';
import { Project } from '../models/project.model';
import { ProjectMember } from '../models/projectMember.model';
import { OrganizationMember } from '../models/organizationMember.model';
import { User } from '../models/user.model';
import {
  InvitationStatus,
  InvitationScope,
  OrgMemberRole,
  OrgMemberStatus,
  ProjectMemberRole,
} from '../common/enums';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { RedisInvitationService } from './redis-invitation.service';
import { MailService } from '../mail/mail.service';
import * as crypto from 'crypto';

@Injectable()
export class InvitationService {
  constructor(
    @InjectModel(Invitation) private readonly invitationModel: typeof Invitation,
    @InjectModel(Organization) private readonly organizationModel: typeof Organization,
    @InjectModel(Project) private readonly projectModel: typeof Project,
    @InjectModel(ProjectMember) private readonly projectMemberModel: typeof ProjectMember,
    @InjectModel(OrganizationMember) private readonly orgMemberModel: typeof OrganizationMember,
    @InjectModel(User) private readonly userModel: typeof User,
    private readonly redisInvitationService: RedisInvitationService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async createInvitation(userId: string, dto: CreateInvitationDto): Promise<Invitation> {
    const organization = await this.organizationModel.findByPk(dto.organization_id);
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const userOrgMember = await this.orgMemberModel.findOne({
      where: { org_id: dto.organization_id, user_id: userId },
    });

    if (dto.scope === InvitationScope.ORGANIZATION) {
      if (!userOrgMember || (userOrgMember.role !== OrgMemberRole.ADMIN && userOrgMember.role !== OrgMemberRole.OWNER)) {
        throw new ForbiddenException('Only organization admins can invite members to the organization');
      }
    }

    if (dto.scope === InvitationScope.PROJECT) {
      if (!dto.project_id) {
        throw new BadRequestException('project_id is required when scope is PROJECT');
      }

      const project = await this.projectModel.findByPk(dto.project_id);
      if (!project) {
        throw new NotFoundException('Project not found');
      }

      const userProjectMember = await this.projectMemberModel.findOne({
        where: { project_id: dto.project_id, user_id: userId },
      });

      const hasPermission =
        (userOrgMember && (userOrgMember.role === OrgMemberRole.ADMIN || userOrgMember.role === OrgMemberRole.OWNER)) ||
        (userProjectMember && userProjectMember.role === ProjectMemberRole.MANAGER);

      if (!hasPermission) {
        throw new ForbiddenException('Only project managers or organization admins can invite members to projects');
      }
    }

    const existingMember =
      dto.scope === InvitationScope.ORGANIZATION
        ? await this.orgMemberModel.findOne({
            where: { org_id: dto.organization_id, user_id: userId },
            include: [{ model: User, where: { email: dto.email } }],
          })
        : await this.projectMemberModel.findOne({
            where: { project_id: dto.project_id },
            include: [{ model: User, where: { email: dto.email } }],
          });

    if (existingMember) {
      throw new ConflictException('This user is already a member');
    }

    const existingPendingInvitation = await this.invitationModel.findOne({
      where: {
        email: dto.email,
        scope: dto.scope,
        organization_id: dto.organization_id,
        project_id: dto.project_id || null,
        status: InvitationStatus.PENDING,
      },
    });

    if (existingPendingInvitation) {
      throw new ConflictException('A pending invitation already exists for this user');
    }

    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await this.invitationModel.create({
      email: dto.email,
      token,
      role: dto.role,
      scope: dto.scope,
      status: InvitationStatus.PENDING,
      organization_id: dto.organization_id,
      project_id: dto.project_id || null,
      invited_by: userId,
      expires_at: expiresAt,
    });

    await this.redisInvitationService.storeInvitation(token, {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      scope: invitation.scope,
      organization_id: invitation.organization_id,
      project_id: invitation.project_id,
      invited_by: invitation.invited_by,
      created_at: invitation.created_at.toISOString(),
      expires_at: invitation.expires_at.toISOString(),
    });

    const frontendUrl = this.configService.get<string>('app.frontendUrl') || 'http://localhost:3000';
    const inviteLink = `${frontendUrl}/join?token=${token}`;

    // Get inviter details for email
    const inviter = await this.userModel.findByPk(userId);

    // Get project name if scope is PROJECT
    let projectName: string | null = null;
    if (dto.scope === InvitationScope.PROJECT && dto.project_id) {
      const project = await this.projectModel.findByPk(dto.project_id);
      projectName = project?.title || null;
    }

    // Send invitation email
    try {
      await this.mailService.sendInvitationEmail(
        dto.email,
        inviter?.name || 'A team member',
        organization.name,
        projectName,
        dto.role,
        inviteLink,
        dto.scope,
      );
      console.log(`✅ Invitation email sent to ${dto.email}`);
    } catch (error) {
      console.error(`⚠️ Failed to send invitation email to ${dto.email}:`, error);
      // Don't fail the invitation creation if email fails
    }

    return {
      ...invitation.toJSON(),
      invite_link: inviteLink,
    } as any;
  }

  async getInvitationByToken(token: string): Promise<any> {
    const redisData = await this.redisInvitationService.getInvitation(token);

    if (redisData) {
      const invitation = await this.invitationModel.findOne({
        where: { token },
        include: [
          {
            model: User,
            as: 'inviter',
            attributes: ['id', 'name', 'email'],
          },
        ],
      });

      return invitation;
    }

    const invitation = await this.invitationModel.findOne({
      where: { token },
      include: [
        {
          model: User,
          as: 'inviter',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status === InvitationStatus.PENDING && new Date() > invitation.expires_at) {
      await invitation.update({ status: InvitationStatus.EXPIRED });
      return { ...invitation.toJSON(), status: InvitationStatus.EXPIRED };
    }

    return invitation;
  }

  async acceptInvitation(userId: string, token: string): Promise<any> {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const redisData = await this.redisInvitationService.getInvitation(token);
    if (!redisData) {
      const dbInvitation = await this.invitationModel.findOne({ where: { token } });
      if (!dbInvitation) {
        throw new NotFoundException('Invitation not found or expired');
      }
      if (dbInvitation.status !== InvitationStatus.PENDING) {
        throw new BadRequestException(`Invitation has already been ${dbInvitation.status.toLowerCase()}`);
      }
      throw new NotFoundException('Invitation has expired');
    }

    if (user.email.toLowerCase() !== redisData.email.toLowerCase()) {
      throw new BadRequestException('This invitation was sent to a different email address');
    }

    const invitation = await this.invitationModel.findOne({ where: { token } });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status === InvitationStatus.ACCEPTED) {
      throw new BadRequestException('This invitation has already been accepted');
    }

    let member: any;

    if (redisData.scope === InvitationScope.ORGANIZATION) {
      const existingMember = await this.orgMemberModel.findOne({
        where: { org_id: redisData.organization_id, user_id: userId },
      });

      if (existingMember) {
        throw new ConflictException('You are already a member of this organization');
      }

      member = await this.orgMemberModel.create({
        org_id: redisData.organization_id,
        user_id: userId,
        role: redisData.role as OrgMemberRole,
        status: OrgMemberStatus.ACTIVE,
      });
    } else if (redisData.scope === InvitationScope.PROJECT) {
      const existingMember = await this.projectMemberModel.findOne({
        where: { project_id: redisData.project_id!, user_id: userId },
      });

      if (existingMember) {
        throw new ConflictException('You are already a member of this project');
      }

      member = await this.projectMemberModel.create({
        project_id: redisData.project_id!,
        user_id: userId,
        role: redisData.role as ProjectMemberRole,
      });
    }

    await invitation.update({
      status: InvitationStatus.ACCEPTED,
      accepted_by: userId,
      accepted_at: new Date(),
    });

    await this.redisInvitationService.deleteInvitation(token);

    // Send notification email to inviter
    try {
      const inviter = await this.userModel.findByPk(redisData.invited_by);
      const organization = await this.organizationModel.findByPk(redisData.organization_id);

      let projectName: string | null = null;
      if (redisData.scope === InvitationScope.PROJECT && redisData.project_id) {
        const project = await this.projectModel.findByPk(redisData.project_id);
        projectName = project?.title || null;
      }

      if (inviter && organization) {
        await this.mailService.sendInvitationAcceptedEmail(
          inviter.email,
          user.name,
          user.email,
          organization.name,
          projectName,
          redisData.scope as InvitationScope,
        );
        console.log(`✅ Acceptance notification sent to ${inviter.email}`);
      }
    } catch (error) {
      console.error('⚠️ Failed to send acceptance notification:', error);
      // Don't fail the acceptance if notification fails
    }

    return {
      message: 'Invitation accepted successfully',
      organization_id: redisData.organization_id,
      project_id: redisData.project_id,
      member,
    };
  }

  async getOrganizationInvitations(userId: string, organizationId: string, filters?: any): Promise<Invitation[]> {
    const userMember = await this.orgMemberModel.findOne({
      where: { org_id: organizationId, user_id: userId },
    });

    if (!userMember || (userMember.role !== OrgMemberRole.ADMIN && userMember.role !== OrgMemberRole.OWNER && userMember.role !== OrgMemberRole.MANAGER)) {
      throw new ForbiddenException('You do not have permission to view invitations');
    }

    const where: any = { organization_id: organizationId };

    if (filters?.status) {
      where.status = filters.status.split(',');
    }

    if (filters?.scope) {
      where.scope = filters.scope.split(',');
    }

    return await this.invitationModel.findAll({
      where,
      include: [
        {
          model: User,
          as: 'inviter',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  async getProjectInvitations(userId: string, projectId: string): Promise<Invitation[]> {
    const project = await this.projectModel.findByPk(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const userProjectMember = await this.projectMemberModel.findOne({
      where: { project_id: projectId, user_id: userId },
    });

    const userOrgMember = await this.orgMemberModel.findOne({
      where: { org_id: project.org_id, user_id: userId },
    });

    const hasPermission =
      (userProjectMember && userProjectMember.role === ProjectMemberRole.MANAGER) ||
      (userOrgMember && (userOrgMember.role === OrgMemberRole.ADMIN || userOrgMember.role === OrgMemberRole.OWNER));

    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to view project invitations');
    }

    return await this.invitationModel.findAll({
      where: { project_id: projectId },
      include: [
        {
          model: User,
          as: 'inviter',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  async revokeInvitation(userId: string, invitationId: string): Promise<void> {
    const invitation = await this.invitationModel.findByPk(invitationId);
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const userOrgMember = await this.orgMemberModel.findOne({
      where: { org_id: invitation.organization_id, user_id: userId },
    });

    let hasPermission = false;

    if (invitation.invited_by === userId) {
      hasPermission = true;
    } else if (userOrgMember && (userOrgMember.role === OrgMemberRole.ADMIN || userOrgMember.role === OrgMemberRole.OWNER)) {
      hasPermission = true;
    } else if (invitation.project_id) {
      const userProjectMember = await this.projectMemberModel.findOne({
        where: { project_id: invitation.project_id, user_id: userId },
      });
      if (userProjectMember && userProjectMember.role === ProjectMemberRole.MANAGER) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to revoke this invitation');
    }

    await invitation.update({ status: InvitationStatus.REVOKED });
    await this.redisInvitationService.deleteInvitation(invitation.token);
  }
}
