import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, UserProfile } from '@/services/auth';

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;

  login: (username: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login({ username, password });

          localStorage.setItem('access_token', response.access);
          localStorage.setItem('refresh_token', response.refresh);

          // Charger le profil utilisateur
          const user = await authService.getCurrentUser();
          set({ user, isLoading: false });
        } catch (error: any) {
          set({
            error: error.response?.data?.detail || 'Erreur de connexion',
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (data: any) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(data);

          localStorage.setItem('access_token', response.access);
          localStorage.setItem('refresh_token', response.refresh);

          const user = await authService.getCurrentUser();
          set({ user, isLoading: false });
        } catch (error: any) {
          set({
            error: error.response?.data?.detail || "Erreur d'inscription",
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        authService.logout();
        set({ user: null });
      },

      loadUser: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        set({ isLoading: true });
        try {
          const user = await authService.getCurrentUser();
          set({ user, isLoading: false });
        } catch (error) {
          set({ user: null, isLoading: false });
        }
      },

      updateProfile: async (data: Partial<UserProfile>) => {
        set({ isLoading: true });
        try {
          const updatedUser = await authService.updateProfile(data);
          set({ user: updatedUser, isLoading: false });
        } catch (error: any) {
          set({
            error: error.response?.data?.detail || 'Erreur de mise à jour',
            isLoading: false,
          });
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
