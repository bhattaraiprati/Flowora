// lib/notificationSocket.ts
import { io, Socket } from 'socket.io-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class NotificationSocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket?.connected) return this.socket;

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    const baseUrl = API_BASE_URL.replace(/\/$/, '');

    this.socket = io(`${baseUrl}/notifications`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Notification socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Notification socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.warn('Notification socket connection error:', error.message);
      console.warn('Make sure the backend server is running at:', baseUrl);
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