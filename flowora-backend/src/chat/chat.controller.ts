import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RequestUser } from '../auth/strategies/jwt.strategy';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { AddReactionDto } from './dto/add-reaction.dto';

interface RequestWithUser extends Request {
  user: RequestUser;
}

@Controller('api/chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('project/:projectId/messages')
  async getProjectMessages(
    @Req() req: RequestWithUser,
    @Param('projectId') projectId: string,
  ) {
    return this.chatService.getProjectMessages(req.user.id, projectId);
  }

  @Post('project/:projectId/messages')
  async sendMessage(
    @Req() req: RequestWithUser,
    @Param('projectId') projectId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.createMessage(req.user.id, projectId, dto);
  }

  @Get('rooms')
  async getUserChatRooms(@Req() req: RequestWithUser) {
      return this.chatService.getUserChatRooms(req.user.id);
  }

  @Patch('messages/:messageId')
  async updateMessage(
    @Req() req: RequestWithUser,
    @Param('messageId') messageId: string,
    @Body() dto: UpdateMessageDto,
  ) {
    return this.chatService.updateMessage(req.user.id, messageId, dto);
  }

  @Delete('messages/:messageId')
  async deleteMessage(
    @Req() req: RequestWithUser,
    @Param('messageId') messageId: string,
  ) {
    await this.chatService.deleteMessage(req.user.id, messageId);
    return { message: 'Message deleted successfully' };
  }

  @Post('messages/:messageId/reactions')
  async addReaction(
    @Req() req: RequestWithUser,
    @Param('messageId') messageId: string,
    @Body() dto: AddReactionDto,
  ) {
    return this.chatService.addReaction(req.user.id, messageId, dto.emoji);
  }

  @Delete('messages/:messageId/reactions/:emoji')
  async removeReaction(
    @Req() req: RequestWithUser,
    @Param('messageId') messageId: string,
    @Param('emoji') emoji: string,
  ) {
    return this.chatService.removeReaction(req.user.id, messageId, emoji);
  }
}
