import { AuthResponse, LoginCredentials, RegisterCredentials } from '@/types/authInterface';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'; // change to your NestJS URL

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies if you use httpOnly
});

// Optional: Add token to every request (if using Authorization header)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // or get from cookie
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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