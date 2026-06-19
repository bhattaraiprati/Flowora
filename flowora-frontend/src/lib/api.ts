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
      localStorage.removeItem('token');
      localStorage.removeItem('auth-storage'); // Zustand persist key
      if (typeof document !== 'undefined') {
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
      // Hard redirect so React state is fully reset
      window.location.replace('/login');
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await api.post('/api/auth/login', credentials);
    return data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const { data } = await api.post('/api/auth/signup', credentials);
    return data;
  },

  // Add logout later
  logout: async () => {
    // Call backend logout if exists
    localStorage.removeItem('token');
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