import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Organization } from '../models/organization.model';
import { OrganizationMember } from '../models/organizationMember.model';
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
    const memberships = await this.organizationMemberModel.findAll({
      where: { user_id: userId, status: OrgMemberStatus.ACTIVE },
      include: [
        {
          model: Organization,
          as: 'organization',
          where: { status: OrganizationStatus.ACTIVE },
        },
      ],
    });

    return memberships.map((m) => ({
      ...m.organization.toJSON(),
      memberRole: m.role,
      joinedAt: m.created_at,
    }));
  }
}
