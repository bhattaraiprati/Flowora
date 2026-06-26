import { AuthResponse, LoginCredentials, RegisterCredentials } from '@/types/authInterface';
import { ChatRoomSummary } from '@/types/ChatInterface';
import { PaginatedNotifications } from '@/types/NotificationInterface';
import { RegisterOrganization } from '@/types/OrganizationInterface';
import { TaskWithProject } from '@/types/TaskInterface';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'; 

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle expired / invalid token globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear all persisted auth state
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('auth-storage'); // Zustand persist key
        if (typeof document !== 'undefined') {
          document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }

        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.replace('/login');
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<{
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      profile_picture?: string;
    };
    expiresAt: number;
    expiresIn: string;
    message: string;
  }> => {
    const { data } = await api.post('/api/auth/login', credentials);
    return data;
  },

  register: async (credentials: RegisterCredentials): Promise<{
    message: string;
    user: {
      id: string;
      email: string;
      name: string;
    };
  }> => {
    const { data } = await api.post('/api/auth/signup', credentials);
    return data;
  },

  logout: async () => {
    // Clear client-side state
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('auth-storage');

      if (typeof document !== 'undefined') {
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    }
  },
};
export const userApi = {

}

export const organizationApi = {
  createOrganization: async (data: {
    name: string;
    slug: string;
    industry: string;
    size: string;
    website?: string;
    description?: string;
  }) => {
    const response = await api.post('/api/organizations', data);
    return response.data;
  },

  getMyOrganizations: async () => {
    const response = await api.get('/api/organizations/my');
    return response.data;
  },

  getOrganization: async (organizationId: string) => {
    const response = await api.get(`/api/organizations/${organizationId}`);
    return response.data;
  },

  registerOrganization: async (data: RegisterOrganization): Promise<{ message: string }> => {
    const response = await api.post('/api/user/registerOrganizer', data);
    return response.data;
  }
};

export const projectApi = {
  createProject: async (
    organizationId: string,
    data: {
      title: string;
      description?: string;
      visibility: string;
      color?: string;
      icon?: string;
    }
  ) => {
    const response = await api.post(`/api/projects/organization/${organizationId}`, data);
    return response.data;
  },

  getOrganizationProjects: async (organizationId: string) => {
    const response = await api.get(`/api/projects/organization/${organizationId}`);
    return response.data;
  },

  getProject: async (projectId: string) => {
    const response = await api.get(`/api/projects/${projectId}`);
    return response.data;
  },

  updateProject: async (
    projectId: string,
    updates: {
      title?: string;
      description?: string;
      visibility?: string;
      color?: string;
      icon?: string;
    }
  ) => {
    const response = await api.patch(`/api/projects/${projectId}`, updates);
    return response.data;
  },

  deleteProject: async (projectId: string) => {
    const response = await api.delete(`/api/projects/${projectId}`);
    return response.data;
  },

  toggleFavorite: async (projectId: string) => {
    const response = await api.patch(`/api/projects/${projectId}/favorite`);
    return response.data;
  },
};

export const taskApi = {
  createTask: async (projectId: string, data: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    assigned_to?: string;
    due_date?: string;
    start_date?: string;
    estimated_hours?: number;
    tags?: string[];
  }) => {
    const response = await api.post(`/api/tasks/project/${projectId}`, data);
    return response.data;
  },

  getProjectTasks: async (projectId: string) => {
    const response = await api.get(`/api/tasks/project/${projectId}`);
    return response.data;
  },

  getTask: async (taskId: string) => {
    const response = await api.get(`/api/tasks/${taskId}`);
    return response.data;
  },
   getMyTasks: async (
    organizationId: string,
    filters?: { status?: string; priority?: string; due_date_from?: string; due_date_to?: string }
  ): Promise<TaskWithProject[]> => {
    const params = new URLSearchParams(filters as Record<string, string>).toString();
    const response = await api.get(
      `/api/tasks/my/organization/${organizationId}${params ? `?${params}` : ''}`
    );
    return response.data;
  },

  updateTask: async (taskId: string, updates: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    assigned_to?: string;
    due_date?: string;
    start_date?: string;
    estimated_hours?: number;
    tags?: string[];
  }) => {
    const response = await api.patch(`/api/tasks/${taskId}`, updates);
    return response.data;
  },

  deleteTask: async (taskId: string) => {
    const response = await api.delete(`/api/tasks/${taskId}`);
    return response.data;
  },

  updateTaskStatus: async (taskId: string, status: string) => {
    const response = await api.patch(`/api/tasks/${taskId}/status`, { status });
    return response.data;
  },

  updateTaskDate: async (taskId: string, date: string, type: 'due_date' | 'start_date') => {
    const response = await api.patch(`/api/tasks/${taskId}/date`, { date, type });
    return response.data;
  },
};

export const inviteApi = {
  createInvitation: async (data: {
    email: string;
    role: string;
    scope: string;
    organization_id: string;
    project_id?: string;
  }) => {
    const response = await api.post('/api/invitations', data);
    return response.data;
  },

  getInvitationByToken: async (token: string) => {
    const response = await api.get(`/api/invitations/token/${token}`);
    return response.data;
  },

  acceptInvitation: async (token: string) => {
    const response = await api.post(`/api/invitations/${token}/accept`);
    return response.data;
  },

  revokeInvitation: async (invitationId: string) => {
    const response = await api.delete(`/api/invitations/${invitationId}`);
    return response.data;
  },

  getOrganizationInvitations: async (organizationId: string) => {
    const response = await api.get(`/api/invitations/organization/${organizationId}`);
    return response.data;
  },

  getProjectInvitations: async (projectId: string) => {
    const response = await api.get(`/api/invitations/project/${projectId}`);
    return response.data;
  },
};

export const memberApi = {
  getProjectMembers: async (projectId: string) => {
    const response = await api.get(`/api/members/project/${projectId}`);
    return response.data;
  },

  getOrganizationMembers: async (organizationId: string) => {
    const response = await api.get(`/api/members/organization/${organizationId}`);
    return response.data;
  },

  updateProjectMemberRole: async (projectId: string, memberId: string, role: string) => {
    const response = await api.patch(`/api/members/project/${projectId}/${memberId}/role`, { role });
    return response.data;
  },

  updateOrganizationMemberRole: async (organizationId: string, memberId: string, role: string) => {
    const response = await api.patch(`/api/members/organization/${organizationId}/${memberId}/role`, { role });
    return response.data;
  },

  removeProjectMember: async (projectId: string, memberId: string) => {
    const response = await api.delete(`/api/members/project/${projectId}/${memberId}`);
    return response.data;
  },

  removeOrganizationMember: async (organizationId: string, memberId: string) => {
    const response = await api.delete(`/api/members/organization/${organizationId}/${memberId}`);
    return response.data;
  },
};

export const chatApi = {
  getProjectMessages: async (projectId: string) => {
    const response = await api.get(`/api/chat/project/${projectId}/messages`);
    return response.data;
  },

  sendMessage: async (projectId: string, data: { message: string; reply_to?: string; attachments?: any[] }) => {
    const response = await api.post(`/api/chat/project/${projectId}/messages`, data);
    console.log("Here is the response ", response)
    return response.data;
  },

   getUserChatRooms: async (): Promise<ChatRoomSummary[]> => {
    const response = await api.get('/api/chat/rooms');
    return response.data;
  },

  deleteMessage: async (messageId: string) => {
    const response = await api.delete(`/api/chat/messages/${messageId}`);
    return response.data;
  },

  editMessage: async (messageId: string, message: string) => {
    const response = await api.patch(`/api/chat/messages/${messageId}`, { message });
    return response.data;
  },

  addReaction: async (messageId: string, emoji: string) => {
    const response = await api.post(`/api/chat/messages/${messageId}/reactions`, { emoji });
    return response.data;
  },

  removeReaction: async (messageId: string, emoji: string) => {
    const response = await api.delete(`/api/chat/messages/${messageId}/reactions/${emoji}`);
    return response.data;
  },
};

// lib/api.ts — add notificationApi
export const notificationApi = {
  getNotifications: async (page = 1, limit = 20): Promise<PaginatedNotifications> => {
    const response = await api.get(`/api/notifications?page=${page}&limit=${limit}`);
    return response.data;
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await api.get('/api/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await api.post(`/api/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.post('/api/notifications/mark-all-read');
    return response.data;
  },

  deleteNotification: async (id: string) => {
    const response = await api.delete(`/api/notifications/${id}`);
    return response.data;
  },
};
