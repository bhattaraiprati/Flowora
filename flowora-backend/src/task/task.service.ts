import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Task } from '../models/task.model';
import { Project } from '../models/project.model';
import { ProjectMember } from '../models/projectMember.model';
import { OrganizationMember } from '../models/organizationMember.model';
import { User } from '../models/user.model';
import { TaskStatus, TaskPriority, ProjectMemberRole, OrgMemberRole } from '../common/enums';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskDateDto, DateType } from './dto/update-task-date.dto';
import { Op } from 'sequelize';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TaskService {
  constructor(
    @InjectModel(Task) private readonly taskModel: typeof Task,
    @InjectModel(Project) private readonly projectModel: typeof Project,
    @InjectModel(ProjectMember) private readonly projectMemberModel: typeof ProjectMember,
    @InjectModel(OrganizationMember) private readonly orgMemberModel: typeof OrganizationMember,
    @InjectModel(User) private readonly userModel: typeof User,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async verifyProjectAccess(
    userId: string,
    projectId: string,
    minimumRole: ProjectMemberRole = ProjectMemberRole.VIEWER,
  ): Promise<{ projectMember: ProjectMember | null; orgMember: OrganizationMember | null }> {
    const project = await this.projectModel.findByPk(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const projectMember = await this.projectMemberModel.findOne({
      where: { project_id: projectId, user_id: userId },
    });

    const orgMember = await this.orgMemberModel.findOne({
      where: { org_id: project.org_id, user_id: userId },
    });

    if (!projectMember && !orgMember) {
      throw new ForbiddenException('You do not have access to this project');
    }

    const hasAccess = this.checkPermission(projectMember, orgMember, minimumRole);
    if (!hasAccess) {
      throw new ForbiddenException(`You need at least ${minimumRole} role to perform this action`);
    }

    return { projectMember, orgMember };
  }

  private checkPermission(
    projectMember: ProjectMember | null,
    orgMember: OrganizationMember | null,
    minimumRole: ProjectMemberRole,
  ): boolean {
    if (orgMember && (orgMember.role === OrgMemberRole.ADMIN || orgMember.role === OrgMemberRole.OWNER)) {
      return true;
    }

    if (orgMember?.role === OrgMemberRole.MANAGER && minimumRole !== ProjectMemberRole.MANAGER) {
      return true;
    }

    if (!projectMember) {
      return false;
    }

    const roleHierarchy = {
      [ProjectMemberRole.VIEWER]: 1,
      [ProjectMemberRole.MEMBER]: 2,
      [ProjectMemberRole.MANAGER]: 3,
    };

    return roleHierarchy[projectMember.role] >= roleHierarchy[minimumRole];
  }

  async createTask(userId: string, projectId: string, dto: CreateTaskDto): Promise<Task> {
    await this.verifyProjectAccess(userId, projectId, ProjectMemberRole.MEMBER);

    if (dto.assigned_to) {
      const assigneeMember = await this.projectMemberModel.findOne({
        where: { project_id: projectId, user_id: dto.assigned_to },
      });
      if (!assigneeMember) {
        throw new BadRequestException('Assigned user is not a member of this project');
      }
    }

    const task = await this.taskModel.create({
      title: dto.title,
      description: dto.description || null,
      status: dto.status || TaskStatus.TODO,
      priority: dto.priority || TaskPriority.MEDIUM,
      project_id: projectId,
      created_by: userId,
      assigned_to: dto.assigned_to || null,
      due_date: dto.due_date ? new Date(dto.due_date) : null,
      start_date: dto.start_date ? new Date(dto.start_date) : null,
      estimated_hours: dto.estimated_hours || null,
      tags: dto.tags || [],
    });

    const createdTask = await this.taskModel.findByPk(task.id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'profile_picture'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'profile_picture'],
        },
      ],
    });

    if (!createdTask) {
      throw new NotFoundException('Task creation failed');
    }

    if (createdTask.assigned_to && createdTask.assigned_to !== userId) {
      const assignedUser = await this.userModel.findByPk(createdTask.assigned_to);
      const assignedBy = await this.userModel.findByPk(userId);

      if (assignedUser && assignedBy) {
        await this.notificationsService.notifyTaskAssigned(
          createdTask,
          assignedUser,
          assignedBy,
        );
      }
    }

    return createdTask;
  }

  async getProjectTasks(userId: string, projectId: string, filters?: any): Promise<Task[]> {
    await this.verifyProjectAccess(userId, projectId, ProjectMemberRole.VIEWER);

    const where: any = { project_id: projectId };

    if (filters?.status) {
      where.status = { [Op.in]: filters.status.split(',') };
    }

    if (filters?.priority) {
      where.priority = { [Op.in]: filters.priority.split(',') };
    }

    if (filters?.assigned_to) {
      where.assigned_to = filters.assigned_to;
    }

    if (filters?.due_date_from || filters?.due_date_to) {
      where.due_date = {};
      if (filters.due_date_from) {
        where.due_date[Op.gte] = new Date(filters.due_date_from);
      }
      if (filters.due_date_to) {
        where.due_date[Op.lte] = new Date(filters.due_date_to);
      }
    }

    return await this.taskModel.findAll({
      where,
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'profile_picture'],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  async getTaskById(userId: string, taskId: string): Promise<Task> {
    const task = await this.taskModel.findByPk(taskId, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'profile_picture'],
        },
        {
          model: Project,
          as: 'project',
        },
      ],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.verifyProjectAccess(userId, task.project_id, ProjectMemberRole.VIEWER);

    return task;
  }

async getMyTasks(userId: string, organizationId: string, filters?: any): Promise<Task[]> {
    // Find every project in this org the user has access to 
    // either via direct project membership, or via org membership
    // (mirrors the access pattern already used in ProjectService.getOrganizationProjects)

    const orgMembership = await this.orgMemberModel.findOne({
      where: { user_id: userId, org_id: organizationId },
    });

    const projectMemberships = await this.projectMemberModel.findAll({
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

    const memberProjectIds = projectMemberships.map((pm) => pm.project_id);

    if (!orgMembership && memberProjectIds.length === 0) {
      throw new ForbiddenException('You do not have access to this organization');
    }

    // Build the project scope: org admins/owners/managers see tasks assigned
    // to them across ALL org projects; regular members/viewers only see tasks
    // in projects they're directly a member of
    let projectScopeIds: string[];

    if (
      orgMembership &&
      [OrgMemberRole.ADMIN, OrgMemberRole.OWNER, OrgMemberRole.MANAGER].includes(orgMembership.role)
    ) {
      const orgProjects = await this.projectModel.findAll({
        where: { org_id: organizationId },
        attributes: ['id'],
      });
      projectScopeIds = orgProjects.map((p) => p.id);
    } else {
      projectScopeIds = memberProjectIds;
    }

    if (projectScopeIds.length === 0) {
      return [];
    }

    // Core filter: tasks assigned to THIS user, within projects they can see
    const where: any = {
      assigned_to: userId,
      project_id: { [Op.in]: projectScopeIds },
    };

    if (filters?.status) {
      where.status = { [Op.in]: filters.status.split(',') };
    }

    if (filters?.priority) {
      where.priority = { [Op.in]: filters.priority.split(',') };
    }

    if (filters?.due_date_from || filters?.due_date_to) {
      where.due_date = {};
      if (filters.due_date_from) {
        where.due_date[Op.gte] = new Date(filters.due_date_from);
      }
      if (filters.due_date_to) {
        where.due_date[Op.lte] = new Date(filters.due_date_to);
      }
    }

    return await this.taskModel.findAll({
      where,
      include: [
        {
          model: this.projectModel,
          as: 'project',
          attributes: ['id', 'title', 'color', 'org_id'],
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'profile_picture'],
        },
      ],
      order: [
        ['due_date', 'ASC'],
        ['created_at', 'DESC'],
      ],
    });
}

  async updateTask(userId: string, taskId: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.taskModel.findByPk(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const { projectMember } = await this.verifyProjectAccess(
      userId,
      task.project_id,
      ProjectMemberRole.MEMBER,
    );

    if (task.created_by !== userId && projectMember?.role === ProjectMemberRole.MEMBER) {
      throw new ForbiddenException('You can only edit your own tasks unless you are a manager');
    }

    if (dto.assigned_to) {
      const assigneeMember = await this.projectMemberModel.findOne({
        where: { project_id: task.project_id, user_id: dto.assigned_to },
      });
      if (!assigneeMember) {
        throw new BadRequestException('Assigned user is not a member of this project');
      }
    }

    const oldStatus = task.status;
    const oldAssignedTo = task.assigned_to;

    await task.update({
      title: dto.title ?? task.title,
      description: dto.description !== undefined ? dto.description : task.description,
      status: dto.status ?? task.status,
      priority: dto.priority ?? task.priority,
      assigned_to: dto.assigned_to !== undefined ? dto.assigned_to : task.assigned_to,
      due_date: dto.due_date !== undefined ? (dto.due_date ? new Date(dto.due_date) : null) : task.due_date,
      start_date: dto.start_date !== undefined ? (dto.start_date ? new Date(dto.start_date) : null) : task.start_date,
      estimated_hours: dto.estimated_hours !== undefined ? dto.estimated_hours : task.estimated_hours,
      tags: dto.tags ?? task.tags,
    });

    const updatedTask = await this.taskModel.findByPk(taskId, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'profile_picture'],
        },
      ],
    });

    if (!updatedTask) {
      throw new NotFoundException('Task not found after update');
    }

    const currentUser = await this.userModel.findByPk(userId);

    if (dto.assigned_to !== undefined && oldAssignedTo !== dto.assigned_to && currentUser) {
      if (oldAssignedTo && dto.assigned_to) {
        const newAssignee = await this.userModel.findByPk(dto.assigned_to);
        const previousAssignee = await this.userModel.findByPk(oldAssignedTo);

        if (newAssignee && previousAssignee) {
          await this.notificationsService.notifyTaskReassigned(
            updatedTask,
            newAssignee,
            previousAssignee,
            currentUser,
          );
        }
      } else if (dto.assigned_to) {
        const assignedUser = await this.userModel.findByPk(dto.assigned_to);
        if (assignedUser && assignedUser.id !== userId) {
          await this.notificationsService.notifyTaskAssigned(
            updatedTask,
            assignedUser,
            currentUser,
          );
        }
      }
    }

    if (dto.status && oldStatus !== dto.status && currentUser) {
      const projectMembers = await this.notificationsService.getProjectMembers(task.project_id);

      if (dto.status === TaskStatus.DONE) {
        await this.notificationsService.notifyTaskCompleted(
          updatedTask,
          currentUser,
          projectMembers,
        );
      } else {
        await this.notificationsService.notifyTaskStatusChanged(
          updatedTask,
          oldStatus,
          dto.status,
          currentUser,
          projectMembers,
        );
      }
    }

    return updatedTask;
  }

  async updateTaskStatus(userId: string, taskId: string, dto: UpdateTaskStatusDto): Promise<Task> {
    const task = await this.taskModel.findByPk(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.verifyProjectAccess(userId, task.project_id, ProjectMemberRole.MEMBER);

    const oldStatus = task.status;

    await task.update({ status: dto.status });

    const updatedTask = await this.taskModel.findByPk(taskId, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'profile_picture'],
        },
      ],
    });

    if (!updatedTask) {
      throw new NotFoundException('Task not found after update');
    }

    if (oldStatus !== dto.status) {
      const currentUser = await this.userModel.findByPk(userId);
      const projectMembers = await this.notificationsService.getProjectMembers(task.project_id);

      if (currentUser) {
        if (dto.status === TaskStatus.DONE) {
          await this.notificationsService.notifyTaskCompleted(
            updatedTask,
            currentUser,
            projectMembers,
          );
        } else {
          await this.notificationsService.notifyTaskStatusChanged(
            updatedTask,
            oldStatus,
            dto.status,
            currentUser,
            projectMembers,
          );
        }
      }
    }

    return updatedTask;
  }

  async updateTaskDate(userId: string, taskId: string, dto: UpdateTaskDateDto): Promise<Task> {
    const task = await this.taskModel.findByPk(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.verifyProjectAccess(userId, task.project_id, ProjectMemberRole.MEMBER);

    const dateValue = dto.date === '' ? null : new Date(dto.date);

    if (dto.type === DateType.DUE_DATE) {
      await task.update({ due_date: dateValue });
    } else if (dto.type === DateType.START_DATE) {
      await task.update({ start_date: dateValue });
    }

    const updatedTask = await this.taskModel.findByPk(taskId, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'profile_picture'],
        },
      ],
    });

    if (!updatedTask) {
      throw new NotFoundException('Task not found after update');
    }

    return updatedTask;
  }

  async deleteTask(userId: string, taskId: string): Promise<void> {
    const task = await this.taskModel.findByPk(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const { projectMember, orgMember } = await this.verifyProjectAccess(
      userId,
      task.project_id,
      ProjectMemberRole.MEMBER,
    );

    const isManager =
      projectMember?.role === ProjectMemberRole.MANAGER ||
      orgMember?.role === OrgMemberRole.ADMIN ||
      orgMember?.role === OrgMemberRole.OWNER;

    if (task.created_by !== userId && !isManager) {
      throw new ForbiddenException('You can only delete your own tasks unless you are a manager');
    }

    await task.destroy();
  }
}