import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Notification } from '../models/notification.model';
import { User } from '../models/user.model';
import { Task } from '../models/task.model';
import { Project } from '../models/project.model';
import { ProjectMember } from '../models/projectMember.model';
import { NotificationType, ReferenceType } from '../common/enums';
import { Op } from 'sequelize';

interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceType?: ReferenceType;
  referenceId?: string;
  metadata: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private notificationsGateway: any;

  constructor(
    @InjectModel(Notification)
    private notificationModel: typeof Notification,
    @InjectModel(Task)
    private taskModel: typeof Task,
    @InjectModel(Project)
    private projectModel: typeof Project,
    @InjectModel(ProjectMember)
    private projectMemberModel: typeof ProjectMember,
  ) {}

  setGateway(gateway: any) {
    this.notificationsGateway = gateway;
  }

  async createNotification(data: CreateNotificationDto): Promise<Notification> {
    try {
      const notification = await this.notificationModel.create({
        user_id: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        reference_type: data.referenceType || null,
        reference_id: data.referenceId || null,
        metadata: data.metadata || null,
        is_read: false,
      });

      // Emit real-time notification via WebSocket
      if (this.notificationsGateway && data.userId) {
        try {
          this.notificationsGateway.sendNotificationToUser(data.userId, notification);

          // Update unread count
          const unreadCount = await this.getUnreadCount(data.userId);
          this.notificationsGateway.updateUnreadCount(data.userId, unreadCount);
        } catch (error) {
          console.error('Failed to emit notification via WebSocket:', error.message);
        }
      }

      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }

  async createBulkNotifications(notifications: CreateNotificationDto[]): Promise<Notification[]> {
    try {
      const notificationData = notifications.map(n => ({
        user_id: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        reference_type: n.referenceType || null,
        reference_id: n.referenceId || null,
        metadata: n.metadata || null,
        is_read: false,
      }));

      const createdNotifications = await this.notificationModel.bulkCreate(notificationData);

      // Emit real-time notifications via WebSocket
      if (this.notificationsGateway) {
        try {
          // Group notifications by user
          const notificationsByUser = new Map<string, Notification[]>();
          createdNotifications.forEach(notification => {
            if (notification.user_id) {
              if (!notificationsByUser.has(notification.user_id)) {
                notificationsByUser.set(notification.user_id, []);
              }
              notificationsByUser.get(notification.user_id)!.push(notification);
            }
          });

          // Emit to each user
          for (const [userId, userNotifications] of notificationsByUser) {
            for (const notification of userNotifications) {
              this.notificationsGateway.sendNotificationToUser(userId, notification);
            }

            // Update unread count once per user
            const unreadCount = await this.getUnreadCount(userId);
            this.notificationsGateway.updateUnreadCount(userId, unreadCount);
          }
        } catch (error) {
          console.error('Failed to emit bulk notifications via WebSocket:', error.message);
        }
      }

      return createdNotifications;
    } catch (error) {
      console.error('Failed to create bulk notifications:', error);
      throw error;
    }
  }

  async getUserNotifications(userId: string, limit: number = 50, offset: number = 0) {
    const { rows: notifications, count } = await this.notificationModel.findAndCountAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    const unreadCount = await this.notificationModel.count({
      where: { user_id: userId, is_read: false },
    });

    return {
      notifications,
      total: count,
      unreadCount,
      hasMore: offset + notifications.length < count,
    };
  }

  async markAsRead(userId: string, notificationId: string): Promise<Notification> {
    const notification = await this.notificationModel.findOne({
      where: { id: notificationId, user_id: userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.is_read = true;
    notification.read_at = new Date();
    await notification.save();

    return notification;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const [affectedCount] = await this.notificationModel.update(
      { is_read: true, read_at: new Date() },
      { where: { user_id: userId, is_read: false } },
    );

    return affectedCount;
  }

  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    const result = await this.notificationModel.destroy({
      where: { id: notificationId, user_id: userId },
    });

    if (result === 0) {
      throw new NotFoundException('Notification not found');
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.count({
      where: { user_id: userId, is_read: false },
    });
  }

  async notifyTaskAssigned(task: Task, assignedUser: User, assignedBy: User) {
    return this.createNotification({
      userId: assignedUser.id,
      type: NotificationType.TASK_ASSIGNED,
      title: 'New Task Assigned',
      message: `${assignedBy.name} assigned you a task: "${task.title}"`,
      referenceType: ReferenceType.TASK,
      referenceId: task.id,
      metadata: {
        taskId: task.id,
        taskTitle: task.title,
        projectId: task.project_id,
        assignedBy: assignedBy.name,
        assignedById: assignedBy.id,
      },
    });
  }

  async notifyTaskReassigned(
    task: Task,
    newAssignee: User,
    previousAssignee: User,
    reassignedBy: User,
  ) {
    const notifications: CreateNotificationDto[] = [
      {
        userId: newAssignee.id,
        type: NotificationType.TASK_REASSIGNED,
        title: 'Task Reassigned to You',
        message: `${reassignedBy.name} reassigned "${task.title}" to you`,
        referenceType: ReferenceType.TASK,
        referenceId: task.id,
        metadata: {
          taskId: task.id,
          taskTitle: task.title,
          projectId: task.project_id,
          reassignedBy: reassignedBy.name,
          previousAssignee: previousAssignee.name,
        },
      },
      {
        userId: previousAssignee.id,
        type: NotificationType.TASK_REASSIGNED,
        title: 'Task Reassigned',
        message: `${reassignedBy.name} reassigned "${task.title}" to ${newAssignee.name}`,
        referenceType: ReferenceType.TASK,
        referenceId: task.id,
        metadata: {
          taskId: task.id,
          taskTitle: task.title,
          projectId: task.project_id,
          reassignedBy: reassignedBy.name,
          newAssignee: newAssignee.name,
        },
      },
    ];

    return this.createBulkNotifications(notifications);
  }

  async notifyTaskStatusChanged(
    task: Task,
    oldStatus: string,
    newStatus: string,
    changedBy: User,
    projectMembers: string[],
  ) {
    const notifications: CreateNotificationDto[] = projectMembers
      .filter(memberId => memberId !== changedBy.id)
      .map(memberId => ({
        userId: memberId,
        type: NotificationType.TASK_STATUS_CHANGED,
        title: 'Task Status Updated',
        message: `${changedBy.name} changed "${task.title}" from ${oldStatus} to ${newStatus}`,
        referenceType: ReferenceType.TASK,
        referenceId: task.id,
        metadata: {
          taskId: task.id,
          taskTitle: task.title,
          projectId: task.project_id,
          oldStatus,
          newStatus,
          changedBy: changedBy.name,
        },
      }));

    return this.createBulkNotifications(notifications);
  }

  async notifyTaskCompleted(task: Task, completedBy: User, projectMembers: string[]) {
    const notifications: CreateNotificationDto[] = projectMembers
      .filter(memberId => memberId !== completedBy.id)
      .map(memberId => ({
        userId: memberId,
        type: NotificationType.TASK_COMPLETED,
        title: 'Task Completed',
        message: `${completedBy.name} completed "${task.title}"`,
        referenceType: ReferenceType.TASK,
        referenceId: task.id,
        metadata: {
          taskId: task.id,
          taskTitle: task.title,
          projectId: task.project_id,
          completedBy: completedBy.name,
        },
      }));

    return this.createBulkNotifications(notifications);
  }

  async notifyTaskDueSoon(task: Task) {
    if (!task.assigned_to) return null;

    return this.createNotification({
      userId: task.assigned_to,
      type: NotificationType.TASK_DUE_SOON,
      title: 'Task Due Soon',
      message: `Task "${task.title}" is due soon`,
      referenceType: ReferenceType.TASK,
      referenceId: task.id,
      metadata: {
        taskId: task.id,
        taskTitle: task.title,
        projectId: task.project_id,
        dueDate: task.due_date,
      },
    });
  }

  async notifyTaskOverdue(task: Task) {
    if (!task.assigned_to) return null;

    return this.createNotification({
      userId: task.assigned_to,
      type: NotificationType.TASK_OVERDUE,
      title: 'Task Overdue',
      message: `Task "${task.title}" is overdue`,
      referenceType: ReferenceType.TASK,
      referenceId: task.id,
      metadata: {
        taskId: task.id,
        taskTitle: task.title,
        projectId: task.project_id,
        dueDate: task.due_date,
      },
    });
  }

  async notifyNewComment(
    taskId: string,
    taskTitle: string,
    commenter: User,
    projectMembers: string[],
  ) {
    const notifications: CreateNotificationDto[] = projectMembers
      .filter(memberId => memberId !== commenter.id)
      .map(memberId => ({
        userId: memberId,
        type: NotificationType.NEW_COMMENT,
        title: 'New Comment',
        message: `${commenter.name} commented on "${taskTitle}"`,
        referenceType: ReferenceType.TASK,
        referenceId: taskId,
        metadata: {
          taskId,
          taskTitle,
          commentedBy: commenter.name,
        },
      }));

    return this.createBulkNotifications(notifications);
  }

  async notifyNewChatMessage(
    projectId: string,
    projectTitle: string,
    sender: User,
    message: string,
    projectMembers: string[],
  ) {
    const notifications: CreateNotificationDto[] = projectMembers
      .filter(memberId => memberId !== sender.id)
      .map(memberId => ({
        userId: memberId,
        type: NotificationType.CHAT_MESSAGE,
        title: `New message in ${projectTitle}`,
        message: `${sender.name}: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
        referenceType: ReferenceType.CHAT,
        referenceId: projectId,
        metadata: {
          projectId,
          projectTitle,
          senderId: sender.id,
          senderName: sender.name,
        },
      }));

    return this.createBulkNotifications(notifications);
  }

  async getProjectMembers(projectId: string): Promise<string[]> {
    const members = await this.projectMemberModel.findAll({
      where: { project_id: projectId },
      attributes: ['user_id'],
    });

    return members.map(m => m.user_id);
  }

  async checkDueSoonTasks() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dueSoonTasks = await this.taskModel.findAll({
        where: {
          due_date: {
            [Op.between]: [today, tomorrow],
          },
          status: { [Op.ne]: 'DONE' },
          assigned_to: { [Op.ne]: null },
        },
        include: [{ model: User, as: 'assignee' }],
      });

      // Create bulk notifications for better performance
      const notificationPromises = dueSoonTasks
        .filter((task): task is Task & { assigned_to: string } => task.assigned_to !== null)
        .map(task =>
          this.createNotification({
            userId: task.assigned_to,
            type: NotificationType.TASK_DUE_SOON,
            title: 'Task Due Soon',
            message: `Task "${task.title}" is due soon`,
            referenceType: ReferenceType.TASK,
            referenceId: task.id,
            metadata: {
              taskId: task.id,
              taskTitle: task.title,
              projectId: task.project_id,
              dueDate: task.due_date,
            },
          })
        );

      await Promise.all(notificationPromises);

      return dueSoonTasks.length;
    } catch (error) {
      console.error('Error checking due soon tasks:', error);
      return 0;
    }
  }

  async checkOverdueTasks() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const overdueTasks = await this.taskModel.findAll({
        where: {
          due_date: { [Op.lt]: today },
          status: { [Op.ne]: 'DONE' },
          assigned_to: { [Op.ne]: null },
        },
        include: [{ model: User, as: 'assignee' }],
      });

      // Batch check for existing notifications
      const taskIds = overdueTasks.map(task => task.id);
      const existingNotifications = await this.notificationModel.findAll({
        where: {
          type: NotificationType.TASK_OVERDUE,
          reference_id: { [Op.in]: taskIds },
          created_at: { [Op.gte]: today },
        },
        attributes: ['reference_id'],
      });

      const notifiedTaskIds = new Set(existingNotifications.map(n => n.reference_id));

      // Create notifications only for tasks not yet notified today
      const notificationPromises = overdueTasks
        .filter((task): task is Task & { assigned_to: string } =>
          task.assigned_to !== null && !notifiedTaskIds.has(task.id)
        )
        .map(task =>
          this.createNotification({
            userId: task.assigned_to,
            type: NotificationType.TASK_OVERDUE,
            title: 'Task Overdue',
            message: `Task "${task.title}" is overdue`,
            referenceType: ReferenceType.TASK,
            referenceId: task.id,
            metadata: {
              taskId: task.id,
              taskTitle: task.title,
              projectId: task.project_id,
              dueDate: task.due_date,
            },
          })
        );

      await Promise.all(notificationPromises);

      return overdueTasks.length;
    } catch (error) {
      console.error('Error checking overdue tasks:', error);
      return 0;
    }
  }
}
