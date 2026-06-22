import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/authInterface';

interface AuthState {
  user: User | null;
  token: string | null;
  expiresAt: number | null; // Unix timestamp
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setAuth: (user: User, token: string, expiresAt: number) => void;
  logout: () => void;
  clearAuth: () => void;
  isTokenValid: () => boolean;
  getTokenExpiresIn: () => number; // Returns seconds until expiration
}

/**
 * Decode JWT and extract expiration time
 */
function decodeTokenExpiration(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp || null;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

/**
 * Check if JWT token is expired
 * @param expiresAt Unix timestamp when token expires
 * @param bufferSeconds Add a buffer before actual expiration (default: 60 seconds)
 */
function isTokenExpired(expiresAt: number | null, bufferSeconds: number = 60): boolean {
  if (!expiresAt) return true;

  const now = Math.floor(Date.now() / 1000);
  return expiresAt <= now + bufferSeconds;
}

/**
 * Convert seconds to human-readable format
 */
function formatExpiresIn(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      expiresAt: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setAuth: (user, token, expiresAt) => {
        // Calculate max-age for cookie (in seconds)
        const now = Math.floor(Date.now() / 1000);
        const maxAge = Math.max(0, expiresAt - now);

        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);

          // Set cookie with correct expiration matching JWT
          if (typeof document !== 'undefined') {
            document.cookie = `token=${token}; path=/; max-age=${maxAge}; SameSite=Lax; Secure`;
          }
        }

        set({
          user,
          token,
          expiresAt,
          isAuthenticated: true,
          _hasHydrated: true,
        });

        // Log for debugging
        console.log('[Auth] Token set, expires in:', formatExpiresIn(maxAge));
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('auth-storage');

          if (typeof document !== 'undefined') {
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          }
        }

        set({
          user: null,
          token: null,
          expiresAt: null,
          isAuthenticated: false,
          _hasHydrated: true,
        });
      },

      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('auth-storage');

          if (typeof document !== 'undefined') {
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          }
        }

        set({
          user: null,
          token: null,
          expiresAt: null,
          isAuthenticated: false,
          _hasHydrated: true,
        });
      },

      isTokenValid: () => {
        const { expiresAt } = get();
        return !isTokenExpired(expiresAt);
      },

      getTokenExpiresIn: () => {
        const { expiresAt } = get();
        if (!expiresAt) return 0;

        const now = Math.floor(Date.now() / 1000);
        return Math.max(0, expiresAt - now);
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        expiresAt: state.expiresAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;

          // Validate token on rehydration
          if (state.token && state.expiresAt) {
            if (isTokenExpired(state.expiresAt, 0)) {
              console.log('[Auth] Token expired, clearing state');

              // Clear expired token
              state.user = null;
              state.token = null;
              state.expiresAt = null;
              state.isAuthenticated = false;

              if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('auth-storage');

                if (typeof document !== 'undefined') {
                  document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                }
              }
            } else {
              state.isAuthenticated = !!state.token && !!state.user;
              const expiresIn = state.expiresAt - Math.floor(Date.now() / 1000);
              console.log('[Auth] Token valid, expires in:', formatExpiresIn(expiresIn));
            }
          } else {
            state.isAuthenticated = false;
          }
        }
      },
    }
  )
);