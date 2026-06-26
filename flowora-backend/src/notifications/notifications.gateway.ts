import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { NotificationsService } from './notifications.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Notification } from '../models/notification.model';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  },
  namespace: 'notifications',
  transports: ['polling', 'websocket'],
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly notificationService: NotificationsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.notificationService.setGateway(this);
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        console.warn('No token provided — disconnecting');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      client.userId = payload.sub;
      client.userName = payload.name;

      if (!client.userId) {
        console.error('JWT payload missing "sub" claim:', payload);
        client.disconnect();
        return;
      }

      client.join(`user:${client.userId}`);

      const unreadCount = await this.notificationService.getUnreadCount(client.userId);
      client.emit('notification:unread_count', { count: unreadCount });

      console.log(`Notification client connected: ${client.userId} (${client.userName})`);
    } catch (error) {
      console.error('WebSocket authentication failed:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      client.leave(`user:${client.userId}`);
    }
    console.log(`🔌 Notification client disconnected: ${client.userId}`);
  }

  @SubscribeMessage('notification:fetch')
  async handleFetchNotifications(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { limit?: number; offset?: number },
  ) {
    try {
      if (!client.userId) {
        return { success: false, message: 'Unauthorized' };
      }

      const result = await this.notificationService.getUserNotifications(
        client.userId,
        data.limit || 50,
        data.offset || 0,
      );

      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @SubscribeMessage('notification:mark_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { notificationId: string },
  ) {
    try {
      if (!client.userId) {
        return { success: false, message: 'Unauthorized' };
      }

      await this.notificationService.markAsRead(client.userId, data.notificationId);
      const unreadCount = await this.notificationService.getUnreadCount(client.userId);

      client.emit('notification:unread_count', { count: unreadCount });

      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @SubscribeMessage('notification:mark_all_read')
  async handleMarkAllAsRead(@ConnectedSocket() client: AuthenticatedSocket) {
    try {
      if (!client.userId) {
        return { success: false, message: 'Unauthorized' };
      }

      await this.notificationService.markAllAsRead(client.userId);

      client.emit('notification:unread_count', { count: 0 });

      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @SubscribeMessage('notification:delete')
  async handleDeleteNotification(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { notificationId: string },
  ) {
    try {
      if (!client.userId) {
        return { success: false, message: 'Unauthorized' };
      }

      await this.notificationService.deleteNotification(client.userId, data.notificationId);

      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @SubscribeMessage('notification:get_unread_count')
  async handleGetUnreadCount(@ConnectedSocket() client: AuthenticatedSocket) {
    try {
      if (!client.userId) {
        return { success: false, message: 'Unauthorized' };
      }

      const count = await this.notificationService.getUnreadCount(client.userId);

      return { success: true, count };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  sendNotificationToUser(userId: string, notification: Notification) {
    try {
      if (!this.server) {
        console.warn('WebSocket server not initialized');
        return;
      }
      this.server.to(`user:${userId}`).emit('notification:new', notification);
      console.log(`Notification sent to user:${userId} - ${notification.title}`);
    } catch (error) {
      console.error(`Failed to send notification to user:${userId}`, error.message);
    }
  }

  sendNotificationToUsers(userIds: string[], notification: Notification) {
    try {
      if (!this.server) {
        console.warn('WebSocket server not initialized');
        return;
      }
      userIds.forEach(userId => {
        this.server.to(`user:${userId}`).emit('notification:new', notification);
      });
      console.log(`Notification sent to ${userIds.length} users - ${notification.title}`);
    } catch (error) {
      console.error(`Failed to send notification to multiple users`, error.message);
    }
  }

  updateUnreadCount(userId: string, count: number) {
    try {
      if (!this.server) {
        console.warn('WebSocket server not initialized');
        return;
      }
      this.server.to(`user:${userId}`).emit('notification:unread_count', { count });
      console.log(`Updated unread count for user:${userId} - ${count}`);
    } catch (error) {
      console.error(`Failed to update unread count for user:${userId}`, error.message);
    }
  }
}
