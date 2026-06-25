import { io, Socket } from 'socket.io-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket) return this.socket;

    const baseUrl = API_BASE_URL.replace(/\/$/, '');

    this.socket = io(`${baseUrl}/chat`, {
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
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

  joinProject(projectId: string) {
    if (!this.socket) return;
    this.socket.emit('join:project', { projectId });
  }

  // Leave project chat room
  leaveProject(projectId: string) {
    this.socket?.emit('leave:project', { projectId });
  }

  sendMessage(projectId: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!this.socket?.connected) {
      resolve(false);
      return;
    }

    const payload = { projectId, message };
    console.log("the payload is ", payload)
    const res: any = this.socket.emit('message:send', payload, (response: any) => {
      resolve(!!response?.success);
    });
    console.log("the emit res is ", res)
  });
}

  // Edit message
  editMessage(messageId: string, message: string) {
    this.socket?.emit('message:edit', { messageId, message });
  }

  // Delete message
  deleteMessage(messageId: string) {
    this.socket?.emit('message:delete', { messageId });
  }

  // Add reaction
  addReaction(messageId: string, emoji: string) {
    this.socket?.emit('reaction:add', { messageId, emoji });
  }

  // Remove reaction
  removeReaction(messageId: string, emoji: string) {
    this.socket?.emit('reaction:remove', { messageId, emoji });
  }

  // Typing indicator
  startTyping(projectId: string) {
    this.socket?.emit('typing:start', { projectId });
  }

  stopTyping(projectId: string) {
    this.socket?.emit('typing:stop', { projectId });
  }

  // Listen to events
  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }
}

export const socketService = new SocketService();
