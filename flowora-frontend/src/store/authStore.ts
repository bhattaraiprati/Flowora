import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/authInterface'; // adjust path if needed

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  clearAuth: () => void; // New helper
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setAuth: (user, token) => {
        if (typeof document !== 'undefined') {
          localStorage.setItem('token', token);
          document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax`;
        }
        set({ 
          user, 
          token, 
          isAuthenticated: true,
          _hasHydrated: true 
        });
      },

      logout: () => {
        if (typeof document !== 'undefined') {
          localStorage.removeItem('token');
          document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          _hasHydrated: true 
        });
      },

      clearAuth: () => {
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          _hasHydrated: true 
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token 
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Mark as hydrated even if no token exists
          state._hasHydrated = true;
          state.isAuthenticated = !!state.token && !!state.user;
        }
      },
    }
  )
);