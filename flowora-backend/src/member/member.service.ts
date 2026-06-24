import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectMember } from '../models/projectMember.model';
import { OrganizationMember } from '../models/organizationMember.model';
import { Project } from '../models/project.model';
import { User } from '../models/user.model';
import { Task } from '../models/task.model';
import { OrgMemberRole, ProjectMemberRole } from '../common/enums';

@Injectable()
export class MemberService {
  constructor(
    @InjectModel(ProjectMember) private readonly projectMemberModel: typeof ProjectMember,
    @InjectModel(OrganizationMember) private readonly orgMemberModel: typeof OrganizationMember,
    @InjectModel(Project) private readonly projectModel: typeof Project,
    @InjectModel(Task) private readonly taskModel: typeof Task,
  ) {}

  async getProjectMembers(userId: string, projectId: string): Promise<ProjectMember[]> {
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

    if (!userProjectMember && !userOrgMember) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return await this.projectMemberModel.findAll({
      where: { project_id: projectId },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'profile_picture'],
        },
      ],
      order: [['created_at', 'ASC']],
    });
  }

  async getOrganizationMembers(userId: string, organizationId: string): Promise<OrganizationMember[]> {
    const userMember = await this.orgMemberModel.findOne({
      where: { org_id: organizationId, user_id: userId },
    });

    if (!userMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return await this.orgMemberModel.findAll({
      where: { org_id: organizationId },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'profile_picture'],
        },
      ],
      order: [['created_at', 'ASC']],
    });
  }

  async updateProjectMemberRole(
    userId: string,
    projectId: string,
    memberId: string,
    newRole: ProjectMemberRole,
  ): Promise<ProjectMember> {
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
      throw new ForbiddenException('You do not have permission to update member roles');
    }

    const targetMember = await this.projectMemberModel.findByPk(memberId);
    if (!targetMember || targetMember.project_id !== projectId) {
      throw new NotFoundException('Member not found');
    }

    if (targetMember.user_id === userId) {
      throw new BadRequestException('You cannot change your own role');
    }

    await targetMember.update({ role: newRole });

    const updatedMember = await this.projectMemberModel.findByPk(memberId, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'profile_picture'],
        },
      ],
    });

    if (!updatedMember) {
      throw new NotFoundException('Member not found after update');
    }

    return updatedMember;
  }

  async updateOrganizationMemberRole(
    userId: string,
    organizationId: string,
    memberId: string,
    newRole: OrgMemberRole,
  ): Promise<OrganizationMember> {
    const userMember = await this.orgMemberModel.findOne({
      where: { org_id: organizationId, user_id: userId },
    });

    if (!userMember || (userMember.role !== OrgMemberRole.ADMIN && userMember.role !== OrgMemberRole.OWNER)) {
      throw new ForbiddenException('Only admins can update member roles');
    }

    const targetMember = await this.orgMemberModel.findByPk(memberId);
    if (!targetMember || targetMember.org_id !== organizationId) {
      throw new NotFoundException('Member not found');
    }

    if (targetMember.user_id === userId) {
      throw new BadRequestException('You cannot change your own role');
    }

    const adminCount = await this.orgMemberModel.count({
      where: {
        org_id: organizationId,
        role: [OrgMemberRole.ADMIN, OrgMemberRole.OWNER],
      },
    });

    if (
      (targetMember.role === OrgMemberRole.ADMIN || targetMember.role === OrgMemberRole.OWNER) &&
      newRole !== OrgMemberRole.ADMIN &&
      newRole !== OrgMemberRole.OWNER &&
      adminCount <= 1
    ) {
      throw new BadRequestException('Cannot remove the last admin from the organization');
    }

    await targetMember.update({ role: newRole });

    const updatedMember = await this.orgMemberModel.findByPk(memberId, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'profile_picture'],
        },
      ],
    });

    if (!updatedMember) {
      throw new NotFoundException('Member not found after update');
    }

    return updatedMember;
  }

  async removeProjectMember(userId: string, projectId: string, memberId: string): Promise<void> {
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
      throw new ForbiddenException('You do not have permission to remove members');
    }

    const targetMember = await this.projectMemberModel.findByPk(memberId);
    if (!targetMember || targetMember.project_id !== projectId) {
      throw new NotFoundException('Member not found');
    }

    if (targetMember.user_id === userId) {
      throw new BadRequestException('You cannot remove yourself from the project');
    }

    await this.taskModel.update(
      { assigned_to: null },
      { where: { project_id: projectId, assigned_to: targetMember.user_id } },
    );

    await targetMember.destroy();
  }

  async removeOrganizationMember(userId: string, organizationId: string, memberId: string): Promise<void> {
    const userMember = await this.orgMemberModel.findOne({
      where: { org_id: organizationId, user_id: userId },
    });

    if (!userMember || (userMember.role !== OrgMemberRole.ADMIN && userMember.role !== OrgMemberRole.OWNER)) {
      throw new ForbiddenException('Only admins can remove members');
    }

    const targetMember = await this.orgMemberModel.findByPk(memberId);
    if (!targetMember || targetMember.org_id !== organizationId) {
      throw new NotFoundException('Member not found');
    }

    if (targetMember.user_id === userId) {
      throw new BadRequestException('You cannot remove yourself from the organization');
    }

    const adminCount = await this.orgMemberModel.count({
      where: {
        org_id: organizationId,
        role: [OrgMemberRole.ADMIN, OrgMemberRole.OWNER],
      },
    });

    if ((targetMember.role === OrgMemberRole.ADMIN || targetMember.role === OrgMemberRole.OWNER) && adminCount <= 1) {
      throw new BadRequestException('Cannot remove the last admin from the organization');
    }

    const projects = await this.projectModel.findAll({
      where: { org_id: organizationId },
      attributes: ['id'],
    });

    const projectIds = projects.map((p) => p.id);

    await this.projectMemberModel.destroy({
      where: { project_id: projectIds, user_id: targetMember.user_id },
    });

    await this.taskModel.update(
      { assigned_to: null },
      { where: { project_id: projectIds, assigned_to: targetMember.user_id } },
    );

    await targetMember.destroy();
  }
}