import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  },
  namespace: 'chat',
  transports: ['polling', 'websocket'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // chat.gateway.ts
// chat.gateway.ts
async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        console.warn('⚠️ No token provided — disconnecting');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      // ✅ FIX: 'sub' is the standard JWT claim for user ID — matches what
      // JwtStrategy maps to `id` for REST requests. Token never had `payload.id`.
      client.userId = payload.sub;
      client.userName = payload.name;

      if (!client.userId) {
        console.error('❌ JWT payload missing "sub" claim:', payload);
        client.disconnect();
        return;
      }

      console.log(`✅ Client connected: ${client.userId} (${client.userName})`);
    } catch (error) {
      console.error('❌ WebSocket authentication failed:', error.message);
      client.disconnect();
    }
}

  handleDisconnect(client: AuthenticatedSocket) {
    console.log(`🔌 Client disconnected: ${client.userId}`);
  }

  @SubscribeMessage('join:project')
  async handleJoinProject(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { projectId: string },
  ) {
    try {
      if (!client.userId) {
        return { success: false, message: 'Unauthorized' };
      }

      await this.chatService.verifyProjectAccess(client.userId, data.projectId);
      client.join(`project:${data.projectId}`);
      console.log(`📌 User ${client.userId} joined project:${data.projectId}`);

      return { success: true, message: 'Joined project room' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @SubscribeMessage('leave:project')
  handleLeaveProject(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { projectId: string },
  ) {
    client.leave(`project:${data.projectId}`);
    console.log(`📤 User ${client.userId} left project:${data.projectId}`);
    return { success: true };
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { projectId: string; message: string;},
  ) {
    try {
      console.log("the user id id ", client.userId);
      if (!client.userId) {
        return { success: false, message: 'Unauthorized' };
      }
      console.log("the messga is ", data.message)

      const newMessage = await this.chatService.createMessage(
        client.userId,
        data.projectId,
        {
          message: data.message,
        },
      );

      this.server.to(`project:${data.projectId}`).emit('message:new', newMessage);

      return { success: true, message: newMessage };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @SubscribeMessage('message:edit')
  async handleEditMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; message: string },
  ) {
    try {
      if (!client.userId) {
        return { success: false, message: 'Unauthorized' };
      }

      const updatedMessage = await this.chatService.updateMessage(
        client.userId,
        data.messageId,
        { message: data.message },
      );

      const projectId = await this.chatService.getProjectIdFromMessage(data.messageId);
      this.server.to(`project:${projectId}`).emit('message:edited', {
        messageId: data.messageId,
        message: updatedMessage,
      });

      return { success: true, message: updatedMessage };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @SubscribeMessage('message:delete')
  async handleDeleteMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string },
  ) {
    try {
      if (!client.userId) {
        return { success: false, message: 'Unauthorized' };
      }

      const projectId = await this.chatService.getProjectIdFromMessage(data.messageId);
      await this.chatService.deleteMessage(client.userId, data.messageId);

      this.server.to(`project:${projectId}`).emit('message:deleted', {
        messageId: data.messageId,
      });

      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @SubscribeMessage('reaction:add')
  async handleAddReaction(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; emoji: string },
  ) {
    try {
      if (!client.userId) {
        return { success: false, message: 'Unauthorized' };
      }

      const reactions = await this.chatService.addReaction(
        client.userId,
        data.messageId,
        data.emoji,
      );

      const projectId = await this.chatService.getProjectIdFromMessage(data.messageId);
      this.server.to(`project:${projectId}`).emit('reaction:updated', {
        messageId: data.messageId,
        reactions,
      });

      return { success: true, reactions };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @SubscribeMessage('reaction:remove')
  async handleRemoveReaction(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; emoji: string },
  ) {
    try {
      if (!client.userId) {
        return { success: false, message: 'Unauthorized' };
      }

      const reactions = await this.chatService.removeReaction(
        client.userId,
        data.messageId,
        data.emoji,
      );

      const projectId = await this.chatService.getProjectIdFromMessage(data.messageId);
      this.server.to(`project:${projectId}`).emit('reaction:updated', {
        messageId: data.messageId,
        reactions,
      });

      return { success: true, reactions };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { projectId: string },
  ) {
    client.to(`project:${data.projectId}`).emit('typing:user', {
      userId: client.userId,
      userName: client.userName,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { projectId: string },
  ) {
    client.to(`project:${data.projectId}`).emit('typing:stopped', {
      userId: client.userId,
      userName: client.userName,
    });
  }
}
