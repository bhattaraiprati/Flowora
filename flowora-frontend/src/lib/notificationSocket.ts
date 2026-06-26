// lib/notificationSocket.ts
import { io, Socket } from 'socket.io-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class NotificationSocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket) return this.socket;

    const baseUrl = API_BASE_URL.replace(/\/$/, '');

    this.socket = io(`${baseUrl}/notifications`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('🔔 Notification socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔔 Notification socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔔 Notification socket connection error:', error.message);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  markAsRead(notificationId: string) {
    this.socket?.emit('notification:mark_read', { notificationId });
  }

  markAllAsRead() {
    this.socket?.emit('notification:mark_all_read');
  }

  deleteNotification(notificationId: string) {
    this.socket?.emit('notification:delete', { notificationId });
  }

  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }
}

export const notificationSocketService = new NotificationSocketService();