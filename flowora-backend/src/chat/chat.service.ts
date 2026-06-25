import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Message } from '../models/message.model';
import { MessageReaction } from '../models/messageReaction.model';
import { Project } from '../models/project.model';
import { ProjectMember } from '../models/projectMember.model';
import { OrganizationMember } from '../models/organizationMember.model';
import { User } from '../models/user.model';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { OrgMemberRole } from '../common/enums';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message) private readonly messageModel: typeof Message,
    @InjectModel(MessageReaction) private readonly reactionModel: typeof MessageReaction,
    @InjectModel(Project) private readonly projectModel: typeof Project,
    @InjectModel(ProjectMember) private readonly projectMemberModel: typeof ProjectMember,
    @InjectModel(OrganizationMember) private readonly orgMemberModel: typeof OrganizationMember,
  ) {}

  async verifyProjectAccess(userId: string, projectId: string): Promise<boolean> {
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

    return true;
  }

  async getProjectMessages(userId: string, projectId: string): Promise<Message[]> {
    await this.verifyProjectAccess(userId, projectId);

    return await this.messageModel.findAll({
      where: { project_id: projectId },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'profile_picture'],
        },
        {
          model: Message,
          as: 'replyToMessage',
          attributes: ['id', 'message', 'user_id'],
          include: [
            {
              model: User,
              attributes: ['id', 'name'],
            },
          ],
        },
        {
          model: MessageReaction,
          as: 'reactions',
          include: [
            {
              model: User,
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
      order: [['created_at', 'ASC']],
    });
  }

  async createMessage(
    userId: string,
    projectId: string,
    dto: SendMessageDto,
  ): Promise<Message> {
    await this.verifyProjectAccess(userId, projectId);

    if (dto.reply_to) {
      const replyMessage = await this.messageModel.findByPk(dto.reply_to);
      if (!replyMessage || replyMessage.project_id !== projectId) {
        throw new BadRequestException('Reply message not found in this project');
      }
    }

    const message = await this.messageModel.create({
      project_id: projectId,
      user_id: userId,
      message: dto.message,
      is_edited: false,
    });

    const createdMessage = await this.messageModel.findByPk(message.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'profile_picture'],
        },
        {
          model: Message,
          as: 'replyToMessage',
          attributes: ['id', 'message', 'user_id'],
          include: [
            {
              model: User,
              attributes: ['id', 'name'],
            },
          ],
        },
        {
          model: MessageReaction,
          as: 'reactions',
        },
      ],
    });

    if (!createdMessage) {
      throw new NotFoundException('Message creation failed');
    }

    return createdMessage;
  }

  async updateMessage(
    userId: string,
    messageId: string,
    dto: UpdateMessageDto,
  ): Promise<Message> {
    const message = await this.messageModel.findByPk(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.user_id !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    await this.verifyProjectAccess(userId, message.project_id);

    await message.update({
      message: dto.message,
      is_edited: true,
    });

    const updatedMessage = await this.messageModel.findByPk(messageId, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'profile_picture'],
        },
        {
          model: MessageReaction,
          as: 'reactions',
        },
      ],
    });

    if (!updatedMessage) {
      throw new NotFoundException('Message not found after update');
    }

    return updatedMessage;
  }

  async deleteMessage(userId: string, messageId: string): Promise<void> {
    const message = await this.messageModel.findByPk(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    await this.verifyProjectAccess(userId, message.project_id);

    const project = await this.projectModel.findByPk(message.project_id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const orgMember = await this.orgMemberModel.findOne({
      where: { org_id: project.org_id, user_id: userId },
    });

    const isAdmin = orgMember && (orgMember.role === OrgMemberRole.ADMIN || orgMember.role === OrgMemberRole.OWNER);

    if (message.user_id !== userId && !isAdmin) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await message.destroy();
  }
  // chat.service.ts — add this method
async getUserChatRooms(userId: string) {
    // Get all projects the user has access to (via project membership OR org membership)
    const projectMemberships = await this.projectMemberModel.findAll({
      where: { user_id: userId },
      attributes: ['project_id'],
    });

    const orgMemberships = await this.orgMemberModel.findAll({
      where: { user_id: userId, status: 'ACTIVE' },
      attributes: ['org_id'],
    });

    const orgIds = orgMemberships.map((m) => m.org_id);

    // Projects via direct membership
    const directProjectIds = projectMemberships.map((m) => m.project_id);

    // Projects via organization (only if you want org-wide project visibility —
    // adjust this if project access should be membership-only)
    const orgProjects = await this.projectModel.findAll({
      where: { org_id: orgIds },
      attributes: ['id'],
    });
    const orgProjectIds = orgProjects.map((p) => p.id);

    const allProjectIds = [...new Set([...directProjectIds, ...orgProjectIds])];

    if (allProjectIds.length === 0) {
      return [];
    }

    // Fetch projects with their latest message + member count
    const projects = await this.projectModel.findAll({
      where: { id: allProjectIds },
      attributes: ['id', 'title', 'color'],
      include: [
        {
          model: this.messageModel,
          as: 'messages',
          limit: 1,
          order: [['created_at', 'DESC']],
          include: [
            {
              model: User,
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
    });

    // Get member counts per project
    const memberCounts = await this.projectMemberModel.findAll({
      where: { project_id: allProjectIds },
      attributes: ['project_id'],
    });
    const countMap = memberCounts.reduce((acc, m) => {
      acc[m.project_id] = (acc[m.project_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return projects
      .map((project) => {
        const lastMessage = (project as any).messages?.[0] ?? null;
        return {
          id: project.id,
          title: project.title,
          color: project.color,
          memberCount: countMap[project.id] || 0,
          lastMessage: lastMessage
            ? {
                text: lastMessage.message,
                senderName: lastMessage.user?.name,
                createdAt: lastMessage.created_at,
              }
            : null,
        };
      })
      .sort((a, b) => {
        // Most recent activity first; projects with no messages go last
        const aTime = a.lastMessage?.createdAt
          ? new Date(a.lastMessage.createdAt).getTime()
          : 0;
        const bTime = b.lastMessage?.createdAt
          ? new Date(b.lastMessage.createdAt).getTime()
          : 0;
        return bTime - aTime;
      });
}

  async addReaction(userId: string, messageId: string, emoji: string): Promise<MessageReaction[]> {
    const message = await this.messageModel.findByPk(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    await this.verifyProjectAccess(userId, message.project_id);

    const existingReaction = await this.reactionModel.findOne({
      where: {
        message_id: messageId,
        user_id: userId,
        emoji,
      },
    });

    if (existingReaction) {
      await existingReaction.destroy();
    } else {
      await this.reactionModel.create({
        message_id: messageId,
        user_id: userId,
        emoji,
      });
    }

    return await this.getMessageReactions(messageId);
  }

  async removeReaction(userId: string, messageId: string, emoji: string): Promise<MessageReaction[]> {
    const message = await this.messageModel.findByPk(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    await this.verifyProjectAccess(userId, message.project_id);

    await this.reactionModel.destroy({
      where: {
        message_id: messageId,
        user_id: userId,
        emoji,
      },
    });

    return await this.getMessageReactions(messageId);
  }

  async getMessageReactions(messageId: string): Promise<MessageReaction[]> {
    return await this.reactionModel.findAll({
      where: { message_id: messageId },
      include: [
        {
          model: User,
          attributes: ['id', 'name'],
        },
      ],
    });
  }

  async getProjectIdFromMessage(messageId: string): Promise<string> {
    const message = await this.messageModel.findByPk(messageId, {
      attributes: ['project_id'],
    });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    return message.project_id;
  }
}
