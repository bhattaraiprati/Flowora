import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Organization } from '../models/organization.model';
import { OrganizationMember } from '../models/organizationMember.model';
import { Project } from '../models/project.model';
import { ProjectMember } from '../models/projectMember.model';
import { User } from '../models/user.model';
import { OrganizationStatus, OrgMemberRole, OrgMemberStatus } from '../common/enums';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectModel(Organization)
    private organizationModel: typeof Organization,
    @InjectModel(OrganizationMember)
    private organizationMemberModel: typeof OrganizationMember,
    @InjectModel(Project)
    private projectModel: typeof Project,
    @InjectModel(ProjectMember)
    private projectMemberModel: typeof ProjectMember,
    private sequelize: Sequelize,
  ) {}

  async createOrganization(
    userId: string,
    data: {
      name: string;
      slug: string;
      industry: string;
      size: string;
      website: string;
      description: string;
    },
  ) {
    const existingOrg = await this.organizationModel.findOne({
      where: { slug: data.slug },
    });

    if (existingOrg) {
      throw new BadRequestException('Organization slug already exists');
    }

    const transaction = await this.sequelize.transaction();

    try {
      // 1. Create Organization
      const organization = await this.organizationModel.create(
        {
          name: data.name,
          slug: data.slug,
          industry: data.industry,
          size: data.size,
          website: data.website,
          description: data.description,
          status: OrganizationStatus.ACTIVE, // Assuming they are active upon creation for SaaS
        },
        { transaction },
      );

      // 2. Add User as OWNER
      await this.organizationMemberModel.create(
        {
          org_id: organization.id,
          user_id: userId,
          role: OrgMemberRole.OWNER,
          status: OrgMemberStatus.ACTIVE,
        },
        { transaction },
      );

      await transaction.commit();

      return {
        message: 'Organization created successfully',
        organization,
      };
    } catch (error) {
      await transaction.rollback();
      throw new InternalServerErrorException('Error creating organization');
    }
  }

  async getUserOrganizations(userId: string) {
    // Get organizations where user is an org member
    const orgMemberships = await this.organizationMemberModel.findAll({
      where: { user_id: userId, status: OrgMemberStatus.ACTIVE },
      include: [
        {
          model: Organization,
          as: 'organization',
          where: { status: OrganizationStatus.ACTIVE },
        },
      ],
    });

    // Get organizations where user is a project member (but not org member)
    const projectMemberships = await this.projectMemberModel.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Project,
          as: 'project',
          required: true,
          include: [
            {
              model: Organization,
              as: 'organization',
              where: { status: OrganizationStatus.ACTIVE },
            },
          ],
        },
      ],
    });

    // Create a map to avoid duplicates and collect project info
    const organizationsMap = new Map();

    // Add org memberships
    orgMemberships.forEach((m) => {
      const orgId = m.organization.id;
      if (!organizationsMap.has(orgId)) {
        organizationsMap.set(orgId, {
          ...m.organization.toJSON(),
          isOrgMember: true,
          memberRole: m.role,
          joinedAt: m.created_at,
          projectMemberships: [],
        });
      }
    });

    // Add project memberships
    projectMemberships.forEach((pm) => {
      const orgId = pm.project.org_id;
      const projectInfo = {
        projectId: pm.project.id,
        projectName: pm.project.title,
        projectRole: pm.role,
        joinedAt: pm.created_at,
      };

      if (organizationsMap.has(orgId)) {
        // Organization already exists, just add project info
        organizationsMap.get(orgId).projectMemberships.push(projectInfo);
      } else {
        // User is not an org member, but is a project member
        organizationsMap.set(orgId, {
          ...pm.project.organization.toJSON(),
          isOrgMember: false,
          memberRole: null,
          joinedAt: pm.created_at,
          projectMemberships: [projectInfo],
        });
      }
    });

    return Array.from(organizationsMap.values());
  }
}
