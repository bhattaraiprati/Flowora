import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RequestUser } from '../auth/strategies/jwt.strategy';
import { NotificationsService } from './notifications.service';

interface RequestWithUser extends Request {
  user: RequestUser;
}

@Controller('api/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Req() req: RequestWithUser,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    // Enforce maximum limit to prevent database overload
    const validatedLimit = Math.min(Math.max(1, limit), 100);
    const validatedOffset = Math.max(0, offset);

    return this.notificationsService.getUserNotifications(req.user.id, validatedLimit, validatedOffset);
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: RequestWithUser) {
    const count = await this.notificationsService.getUnreadCount(req.user.id);
    return { count };
  }

  @Post(':id/read')
  async markAsRead(@Req() req: RequestWithUser, @Param('id') notificationId: string) {
    const notification = await this.notificationsService.markAsRead(
      req.user.id,
      notificationId,
    );
    return { success: true, notification };
  }

  @Post('mark-all-read')
  async markAllAsRead(@Req() req: RequestWithUser) {
    const count = await this.notificationsService.markAllAsRead(req.user.id);
    return { success: true, count };
  }

  @Delete(':id')
  async deleteNotification(@Req() req: RequestWithUser, @Param('id') notificationId: string) {
    await this.notificationsService.deleteNotification(req.user.id, notificationId);
    return { success: true };
  }
}
