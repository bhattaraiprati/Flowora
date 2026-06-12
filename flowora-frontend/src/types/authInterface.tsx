export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'manager'; // adjust as per your backend
  avatarInitials?: string;
}

export interface DecodedToken {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}
export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}