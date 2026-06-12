import { User } from '@/types/authInterface';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';


interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        localStorage.setItem('token', token); // fallback
        if (typeof document !== 'undefined') {
          document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax`;
        }
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('token');
        if (typeof document !== 'undefined') {
          document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }), // persist only these
    }
  )
);