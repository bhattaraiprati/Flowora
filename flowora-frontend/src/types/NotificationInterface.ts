// types/NotificationInterface.ts
export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_REASSIGNED'
  | 'TASK_DUE_SOON'
  | 'TASK_OVERDUE'
  | 'TASK_COMPLETED'
  | 'NEW_COMMENT'
  | 'CHAT_MESSAGE'
  | 'INVITED'
  | 'PROJECT_CREATED'
  | 'USER_ADDED_TO_PROJECT';

export type ReferenceType = 'TASK' | 'PROJECT' | 'CHAT' | 'INVITATION';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  reference_type?: ReferenceType;
  reference_id?: string;
  is_read: boolean;
  read_at?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface PaginatedNotifications {
  data: Notification[];
  total: number;
  page: number;
  totalPages: number;
}