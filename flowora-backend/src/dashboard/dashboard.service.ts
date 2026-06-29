// dashboard.service.ts
import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Project } from '../models/project.model';
import { Task } from '../models/task.model';
import { ProjectMember } from '../models/projectMember.model';
import { OrganizationMember } from '../models/organizationMember.model';
import { User } from '../models/user.model';
import { TaskStatus } from '../common/enums';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Project) private readonly projectModel: typeof Project,
    @InjectModel(Task) private readonly taskModel: typeof Task,
    @InjectModel(ProjectMember) private readonly projectMemberModel: typeof ProjectMember,
    @InjectModel(OrganizationMember) private readonly orgMemberModel: typeof OrganizationMember,
  ) {}

  async getUserDashboard(userId: string, organizationId: string) {

    const orgMembership = await this.orgMemberModel.findOne({
      where: { user_id: userId, org_id: organizationId },
    });

    const myProjectMemberships = await this.projectMemberModel.findAll({
      where: { user_id: userId },
      include: [
        {
          model: this.projectModel,
          as: 'project',
          where: { org_id: organizationId },
          attributes: ['id'],
        },
      ],
      attributes: ['project_id'],
    });

    const myProjectIds = myProjectMemberships.map((pm) => pm.project_id);

    if (!orgMembership && myProjectIds.length === 0) {
      throw new ForbiddenException('You do not have access to this organization');
    }

    let scopeProjectIds: string[];
    if (
      orgMembership &&
      ['ADMIN', 'OWNER', 'MANAGER'].includes(orgMembership.role)
    ) {
      const orgProjects = await this.projectModel.findAll({
        where: { org_id: organizationId, status: 'ACTIVE' },
        attributes: ['id'],
      });
      scopeProjectIds = orgProjects.map((p) => p.id);
    } else {
      scopeProjectIds = myProjectIds;
    }

    // Run all four sections in parallel — independent queries
    const [stats, myTasks, recentBoards, recentActivity] = await Promise.all([
      this.getStats(organizationId, scopeProjectIds, userId),
      this.getMyUpcomingTasks(userId, scopeProjectIds),
      this.getRecentBoards(myProjectIds),
      this.getRecentActivity(scopeProjectIds),
    ]);

    return { stats, myTasks, recentBoards, recentActivity };
  }

  private async getStats(organizationId: string, scopeProjectIds: string[], userId: string) {
    if (scopeProjectIds.length === 0) {
      return { activeProjects: 0, tasksDueToday: 0, teamMembers: 0, completedThisWeek: 0 };
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [activeProjects, tasksDueToday, teamMembers, completedThisWeek] = await Promise.all([
      this.projectModel.count({
        where: { id: scopeProjectIds, status: 'ACTIVE' },
      }),
      this.taskModel.count({
        where: {
          project_id: scopeProjectIds,
          assigned_to: userId,
          due_date: { [Op.between]: [todayStart, todayEnd] },
          status: { [Op.ne]: TaskStatus.DONE },
        },
      }),
      this.orgMemberModel.count({
        where: { org_id: organizationId, status: 'ACTIVE' },
      }),
      this.taskModel.count({
        where: {
          project_id: scopeProjectIds,
          status: TaskStatus.DONE,
          updated_at: { [Op.gte]: weekAgo },
        },
      }),
    ]);

    return { activeProjects, tasksDueToday, teamMembers, completedThisWeek };
  }

  private async getMyUpcomingTasks(userId: string, scopeProjectIds: string[]) {
    if (scopeProjectIds.length === 0) return [];

    return await this.taskModel.findAll({
      where: {
        assigned_to: userId,
        project_id: scopeProjectIds,
        status: { [Op.ne]: TaskStatus.DONE },
      },
      include: [
        {
          model: this.projectModel,
          as: 'project',
          attributes: ['id', 'title', 'color'],
        },
      ],
      order: [
        ['due_date', 'ASC'], // nulls sort last in Postgres ASC
        ['created_at', 'DESC'],
      ],
      limit: 5,
    });
  }

  private async getRecentBoards(myProjectIds: string[]) {
    if (myProjectIds.length === 0) return [];

    const projects = await this.projectModel.findAll({
      where: { id: myProjectIds, status: 'ACTIVE' },
      include: [
        {
          model: ProjectMember,
          as: 'members',
          include: [{ model: User, attributes: ['id', 'name'] }],
        },
      ],
      order: [['updated_at', 'DESC']],
      limit: 4,
    });

    const projectIds = projects.map((p) => p.id);
    const taskCounts = await this.taskModel.findAll({
      where: { project_id: projectIds },
      attributes: ['project_id', 'status'],
    });

    const progressMap: Record<string, { total: number; done: number }> = {};
    taskCounts.forEach((t) => {
      if (!progressMap[t.project_id]) progressMap[t.project_id] = { total: 0, done: 0 };
      progressMap[t.project_id].total += 1;
      if (t.status === TaskStatus.DONE) progressMap[t.project_id].done += 1;
    });

    return projects.map((project) => {
      const counts = progressMap[project.id] || { total: 0, done: 0 };
      const progress = counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0;

      return {
        id: project.id,
        title: project.title,
        color: project.color,
        progress,
        taskCount: counts.total,
        members: project.members.map((m) => ({
          id: m.user_id,
          name: (m as any).user?.name ?? '?',
        })),
        updatedAt: project.updated_at,
      };
    });
  }

  private async getRecentActivity(scopeProjectIds: string[]) {
    if (scopeProjectIds.length === 0) return [];

    // Best-effort: tasks that changed recently, inferred as "activity"
    // Limitation: we can only show the CURRENT status, not the transition
    // (e.g. we know it's now DONE, but not that it moved FROM "In Review")
    // since there's no activity/audit table to read history from.
    const recentlyUpdatedTasks = await this.taskModel.findAll({
      where: { project_id: scopeProjectIds },
      include: [
        { model: this.projectModel, as: 'project', attributes: ['id', 'title'] },
        { model: User, as: 'assignee', attributes: ['id', 'name'] },
      ],
      order: [['updated_at', 'DESC']],
      limit: 5,
    });

    return recentlyUpdatedTasks.map((task) => ({
      taskId: task.id,
      taskTitle: task.title,
      status: task.status,
      projectId: task.project.id,
      projectTitle: task.project.title,
      actorName: (task as any).assignee?.name ?? 'Someone',
      updatedAt: task.updated_at,
    }));
  }
}