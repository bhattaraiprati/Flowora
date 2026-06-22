import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Project, ProjectVisibility } from '../models/project.model';
import { ProjectMember } from '../models/projectMember.model';
import { OrganizationMember } from '../models/organizationMember.model';
import { User } from '../models/user.model';
import { ProjectStatus, ProjectMemberRole, OrgMemberRole } from '../common/enums';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project) private readonly projectModel: typeof Project,
    @InjectModel(ProjectMember) private readonly projectMemberModel: typeof ProjectMember,
    @InjectModel(OrganizationMember) private readonly orgMemberModel: typeof OrganizationMember,
  ) {}

  /**
   * Verify user has access to organization
   */
  private async verifyOrganizationAccess(userId: string, organizationId: string): Promise<void> {
    const membership = await this.orgMemberModel.findOne({
      where: {
        user_id: userId,
        org_id: organizationId,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this organization');
    }
  }

  /**
   * Create a new project/board
   */
  async createProject(
    userId: string,
    organizationId: string,
    dto: CreateProjectDto,
  ): Promise<Project> {
    // Verify organization access
    await this.verifyOrganizationAccess(userId, organizationId);

    // Check for duplicate project title in organization
    const existingProject = await this.projectModel.findOne({
      where: {
        title: dto.title,
        org_id: organizationId,
        status: ProjectStatus.ACTIVE,
      },
    });

    if (existingProject) {
      throw new ConflictException('A project with this title already exists in this organization');
    }

    // Create project in transaction
    return await this.projectModel.sequelize!.transaction(async (transaction) => {
      // Create project
      const project = await this.projectModel.create(
        {
          title: dto.title,
          description: dto.description || null,
          visibility: dto.visibility,
          color: dto.color || '#6366f1',
          org_id: organizationId,
          created_by: userId,
          status: ProjectStatus.ACTIVE,
          is_favorite: false,
        },
        { transaction },
      );

      // Add creator as project manager
      await this.projectMemberModel.create(
        {
          project_id: project.id,
          user_id: userId,
          role: ProjectMemberRole.MANAGER,
        },
        { transaction },
      );

      return project;
    });
  }

  /**
   * Get all projects for an organization
   */
  async getOrganizationProjects(
    userId: string,
    organizationId: string,
  ): Promise<Project[]> {
    // Verify organization access
    await this.verifyOrganizationAccess(userId, organizationId);

    // Get user's role in organization
    const orgMembership = await this.orgMemberModel.findOne({
      where: {
        user_id: userId,
        org_id: organizationId,
      },
    });

    // Fetch projects based on visibility and user access
    const whereConditions: any = {
      org_id: organizationId,
      status: ProjectStatus.ACTIVE,
    };

    // If not owner/admin, only show workspace/public projects or projects user is a member of
    if (orgMembership?.role === OrgMemberRole.MEMBER) {
      const userProjects = await this.projectMemberModel.findAll({
        where: { user_id: userId },
        attributes: ['project_id'],
      });

      const projectIds = userProjects.map((pm) => pm.project_id);

      whereConditions.$or = [
        { visibility: [ProjectVisibility.WORKSPACE, ProjectVisibility.PUBLIC] },
        { id: projectIds },
      ];
    }

    const projects = await this.projectModel.findAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'profile_picture'],
        },
        {
          model: ProjectMember,
          as: 'members',
          include: [
            {
              model: User,
              attributes: ['id', 'name', 'email', 'profile_picture'],
            },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return projects;
  }

  /**
   * Get single project by ID
   */
  async getProjectById(
    userId: string,
    projectId: string,
  ): Promise<Project> {
    const project = await this.projectModel.findByPk(projectId, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'profile_picture'],
        },
        {
          model: ProjectMember,
          as: 'members',
          include: [
            {
              model: User,
              attributes: ['id', 'name', 'email', 'profile_picture'],
            },
          ],
        },
      ],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verify user has access to organization
    await this.verifyOrganizationAccess(userId, project.org_id);

    // Check if user has access to private project
    if (project.visibility === ProjectVisibility.PRIVATE) {
      const isMember = project.members.some((m) => m.user_id === userId);
      if (!isMember) {
        throw new ForbiddenException('You do not have access to this private project');
      }
    }

    return project;
  }

  /**
   * Update project
   */
  async updateProject(
    userId: string,
    projectId: string,
    updates: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.projectModel.findOne({
      where: { id: projectId },
      attributes: ['id', 'title', 'description', 'org_id', 'visibility', 'color', 'status'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verify organization access
    await this.verifyOrganizationAccess(userId, project.org_id);

    // Check if user is project manager
    const membership = await this.projectMemberModel.findOne({
      where: {
        project_id: projectId,
        user_id: userId,
        role: ProjectMemberRole.MANAGER,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Only project managers can update the project');
    }

    await project.update(updates);

    // Return full project with relations
    const updatedProject = await this.projectModel.findByPk(projectId, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'profile_picture'],
        },
        {
          model: ProjectMember,
          as: 'members',
          include: [
            {
              model: User,
              attributes: ['id', 'name', 'email', 'profile_picture'],
            },
          ],
        },
      ],
    });

    if (!updatedProject) {
      throw new NotFoundException('Project not found after update');
    }

    return updatedProject;
  }

  /**
   * Delete (archive) project
   */
  async deleteProject(userId: string, projectId: string): Promise<{ message: string }> {
    const project = await this.projectModel.findOne({
      where: { id: projectId },
      attributes: ['id', 'title', 'org_id', 'created_by', 'status'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verify organization access
    await this.verifyOrganizationAccess(userId, project.org_id);

    // Only creator or org admin can delete
    if (project.created_by !== userId) {
      const orgMembership = await this.orgMemberModel.findOne({
        where: {
          user_id: userId,
          org_id: project.org_id,
        },
      });

      if (!orgMembership || orgMembership.role === OrgMemberRole.MEMBER) {
        throw new ForbiddenException('Only project creator or organization admin can delete the project');
      }
    }

    // Archive instead of hard delete
    await project.update({ status: ProjectStatus.ARCHIVED });

    return { message: 'Project archived successfully' };
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(userId: string, projectId: string): Promise<Project> {
    const project = await this.projectModel.findOne({
      where: { id: projectId },
      attributes: ['id', 'title', 'org_id', 'is_favorite', 'visibility'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verify organization access
    await this.verifyOrganizationAccess(userId, project.org_id);

    // Check access for private projects
    if (project.visibility === ProjectVisibility.PRIVATE) {
      const isMember = await this.projectMemberModel.findOne({
        where: {
          project_id: projectId,
          user_id: userId,
        },
      });

      if (!isMember) {
        throw new ForbiddenException('You do not have access to this private project');
      }
    }

    await project.update({ is_favorite: !project.is_favorite });

    // Return full project details
    const updatedProject = await this.projectModel.findByPk(projectId, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'profile_picture'],
        },
        {
          model: ProjectMember,
          as: 'members',
          include: [
            {
              model: User,
              attributes: ['id', 'name', 'email', 'profile_picture'],
            },
          ],
        },
      ],
    });

    if (!updatedProject) {
      throw new NotFoundException('Project not found after favorite toggle');
    }

    return updatedProject;
  }
}
