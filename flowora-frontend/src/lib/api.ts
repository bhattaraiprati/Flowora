import { AuthResponse, LoginCredentials, RegisterCredentials } from '@/types/authInterface';
import { RegisterOrganization } from '@/types/OrganizationInterface';
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
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      organizationId: string | null;
    };
    token: string;
    expiresIn: string;
    expiresAt: number;
    message: string;
  }> => {
    const { data } = await api.post('/api/auth/login', credentials);
    return data;
  },

  register: async (credentials: RegisterCredentials): Promise<{ message: string }> => {
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