export interface ChatMessage {
  id: string;
  project_id: string;
  user_id: string;
  message: string;
  attachments?: ChatAttachment[];
  reply_to?: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    profile_picture?: string;
  };
  reactions?: MessageReaction[];
  is_edited?: boolean;
}

export interface ChatAttachment {
  id: string;
  type: 'image' | 'file' | 'video';
  url: string;
  name: string;
  size: number;
}

export interface MessageReaction {
  emoji: string;
  user_ids: string[];
  count: number;
}

export interface ChatRoom {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  created_at: string;
  unread_count?: number;
  last_message?: ChatMessage;
}

export interface TypingIndicator {
  user_id: string;
  user_name: string;
  timestamp: number;
}
