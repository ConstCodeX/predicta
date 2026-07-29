import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPERADMIN' | 'ANALYST';
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json() as { access_token?: string; user?: AuthUser; message?: string };
          if (!res.ok) throw new Error(data.message ?? 'Error de autenticación');
          set({ token: data.access_token!, user: data.user!, isLoading: false });
        } catch (err) {
          set({ isLoading: false, error: (err as Error).message });
          throw err;
        }
      },

      logout: () => set({ token: null, user: null, error: null }),
      clearError: () => set({ error: null }),
    }),
    { name: 'predicta-auth', partialize: (s) => ({ token: s.token, user: s.user }) },
  ),
);
