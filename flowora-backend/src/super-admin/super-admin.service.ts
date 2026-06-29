import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Organization } from '../models/organization.model';
import { User } from '../models/user.model';
import { Project } from '../models/project.model';
import { Task } from '../models/task.model';
import { OrganizationMember } from '../models/organizationMember.model';
import { OrganizationStatus, UserStatus } from '../common/enums';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class SuperAdminService {
  constructor(
    @InjectModel(Organization) private organizationModel: typeof Organization,
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(Project) private projectModel: typeof Project,
    @InjectModel(Task) private taskModel: typeof Task,
    @InjectModel(OrganizationMember) private organizationMemberModel: typeof OrganizationMember,
    private sequelize: Sequelize,
  ) {}

  async getStats() {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    const [
      totalOrganizations,
      pendingApprovals,
      suspendedOrganizations,
      activeUsers,
      prevMonthOrganizations,
      prevMonthUsers,
    ] = await Promise.all([
      this.organizationModel.count(),
      this.organizationModel.count({ where: { status: OrganizationStatus.PENDING_APPROVAL } }),
      this.organizationModel.count({ where: { status: OrganizationStatus.SUSPENDED } }),
      this.userModel.count({ where: { status: UserStatus.ACTIVE } }),
      this.organizationModel.count({ where: { created_at: { [Op.lt]: lastMonth } } }),
      this.userModel.count({ where: { created_at: { [Op.lt]: lastMonth }, status: UserStatus.ACTIVE } }),
    ]);

    const orgTrend = prevMonthOrganizations > 0
      ? Math.round(((totalOrganizations - prevMonthOrganizations) / prevMonthOrganizations) * 100)
      : 0;

    const userTrend = prevMonthUsers > 0
      ? Math.round(((activeUsers - prevMonthUsers) / prevMonthUsers) * 100)
      : 0;

    return {
      totalOrganizations,
      pendingApprovals,
      activeUsers,
      suspendedOrganizations,
      trends: {
        organizations: orgTrend,
        users: userTrend,
        activity: 12,
      },
    };
  }

  async getOrganizations(status: string, search: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const whereClause: any = {};

    if (status && status !== 'all') {
      whereClause.status = status.toUpperCase().replace('-', '_');
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { slug: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await this.organizationModel.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: this.organizationMemberModel,
          as: 'members',
          include: [{ model: this.userModel, as: 'user' }],
        },
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']],
      distinct: true,
    });

    const organizations = await Promise.all(
      rows.map(async (org) => {
        const [projectCount, adminMember] = await Promise.all([
          this.projectModel.count({ where: { org_id: org.id } }),
          this.organizationMemberModel.findOne({
            where: { org_id: org.id, role: 'OWNER' },
            include: [{ model: this.userModel, as: 'user' }],
          }),
        ]);

        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          email: adminMember?.user?.email || '',
          industry: org.industry,
          size: org.size,
          status: org.status,
          memberCount: org.members?.length || 0,
          projectCount,
          createdAt: org.created_at,
          adminName: adminMember?.user?.name || 'N/A',
        };
      }),
    );

    return {
      organizations,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async getOrganizationDetails(organizationId: string) {
    const organization = await this.organizationModel.findByPk(organizationId, {
      include: [
        {
          model: this.organizationMemberModel,
          as: 'members',
          include: [{ model: this.userModel, as: 'user' }],
        },
      ],
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const adminMember = organization.members.find((m) => m.role === 'OWNER');
    const [projectCount, taskCount] = await Promise.all([
      this.projectModel.count({ where: { org_id: organization.id } }),
      this.taskModel.count({
        include: [
          {
            model: this.projectModel,
            where: { org_id: organization.id },
            required: true,
          },
        ],
      }),
    ]);

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      email: adminMember?.user?.email || '',
      industry: organization.industry,
      size: organization.size,
      website: organization.website,
      description: organization.description,
      status: organization.status,
      createdAt: organization.created_at,
      approvedAt: organization.approved_at,
      adminName: adminMember?.user?.name || 'N/A',
      memberCount: organization.members?.length || 0,
      projectCount,
      taskCount,
      activityStats: {
        totalLogins: 0,
        lastLoginAt: null,
        tasksCompleted: 0,
        projectsCreated: projectCount,
      },
    };
  }

  async approveOrganization(organizationId: string, superAdminId: string, notes?: string) {
    const organization = await this.organizationModel.findByPk(organizationId);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (organization.status !== OrganizationStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Organization is not pending approval');
    }

    organization.status = OrganizationStatus.ACTIVE;
    organization.approved_by = superAdminId;
    organization.approved_at = new Date();
    await organization.save();

    return {
      success: true,
      message: 'Organization approved successfully',
    };
  }

  async rejectOrganization(organizationId: string, reason: string) {
    const organization = await this.organizationModel.findByPk(organizationId);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (organization.status !== OrganizationStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Organization is not pending approval');
    }

    organization.status = OrganizationStatus.REJECTED;
    organization.rejection_reason = reason;
    await organization.save();

    return {
      success: true,
      message: 'Organization rejected',
    };
  }

  async suspendOrganization(organizationId: string, reason: string) {
    const organization = await this.organizationModel.findByPk(organizationId, {
      include: [{ model: this.organizationMemberModel, as: 'members' }],
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (organization.status !== OrganizationStatus.ACTIVE) {
      throw new BadRequestException('Organization is not active');
    }

    await this.sequelize.transaction(async (transaction) => {
      organization.status = OrganizationStatus.SUSPENDED;
      await organization.save({ transaction });

      const userIds = organization.members.map((m) => m.user_id);
      await this.userModel.update(
        { status: UserStatus.SUSPENDED },
        { where: { id: { [Op.in]: userIds } }, transaction },
      );
    });

    return {
      success: true,
      message: 'Organization suspended',
    };
  }

  async unsuspendOrganization(organizationId: string, notes?: string) {
    const organization = await this.organizationModel.findByPk(organizationId, {
      include: [{ model: this.organizationMemberModel, as: 'members' }],
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (organization.status !== OrganizationStatus.SUSPENDED) {
      throw new BadRequestException('Organization is not suspended');
    }

    await this.sequelize.transaction(async (transaction) => {
      organization.status = OrganizationStatus.ACTIVE;
      await organization.save({ transaction });

      const userIds = organization.members.map((m) => m.user_id);
      await this.userModel.update(
        { status: UserStatus.ACTIVE },
        { where: { id: { [Op.in]: userIds } }, transaction },
      );
    });

    return {
      success: true,
      message: 'Organization unsuspended',
    };
  }

  async getPlatformActivity(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dailyActivity: Array<{
      date: string;
      users: number;
      organizations: number;
      projects: number;
      tasks: number;
    }> = [];
    const summary = {
      totalLogins: 0,
      newOrganizations: 0,
      newProjects: 0,
      newTasks: 0,
    };

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const [users, organizations, projects, tasks] = await Promise.all([
        this.userModel.count({
          where: {
            created_at: { [Op.between]: [dayStart, dayEnd] },
          },
        }),
        this.organizationModel.count({
          where: {
            created_at: { [Op.between]: [dayStart, dayEnd] },
          },
        }),
        this.projectModel.count({
          where: {
            created_at: { [Op.between]: [dayStart, dayEnd] },
          },
        }),
        this.taskModel.count({
          where: {
            created_at: { [Op.between]: [dayStart, dayEnd] },
          },
        }),
      ]);

      dailyActivity.unshift({
        date: dateStr,
        users,
        organizations,
        projects,
        tasks,
      });

      summary.newOrganizations += organizations;
      summary.newProjects += projects;
      summary.newTasks += tasks;
    }

    return {
      dailyActivity,
      summary,
    };
  }

  async getPendingApprovals() {
    const organizations = await this.organizationModel.findAll({
      where: { status: OrganizationStatus.PENDING_APPROVAL },
      include: [
        {
          model: this.organizationMemberModel,
          as: 'members',
          where: { role: 'OWNER' },
          include: [{ model: this.userModel, as: 'user' }],
        },
      ],
      order: [['created_at', 'ASC']],
      limit: 50,
    });

    const formattedOrganizations = organizations.map((org) => {
      const adminMember = org.members.find((m) => m.role === 'OWNER');
      return {
        id: org.id,
        organizationName: org.name,
        adminName: adminMember?.user?.name || 'N/A',
        email: adminMember?.user?.email || '',
        industry: org.industry,
        createdAt: org.created_at,
        website: org.website,
      };
    });

    return {
      count: formattedOrganizations.length,
      organizations: formattedOrganizations,
    };
  }
}
