import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/services/api';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  fetchUser: () => Promise<void>;
  login: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      loading: true,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setAccessToken: (token) => {
        set({ accessToken: token });
      },

      setLoading: (loading) => set({ loading }),

      fetchUser: async () => {
        const { accessToken } = get();
        
        if (!accessToken) {
          set({ loading: false, isAuthenticated: false });
          return;
        }

        try {
          const response = await api.get('/auth/me');
          set({ 
            user: response.data, 
            isAuthenticated: true, 
            loading: false,
            accessToken: accessToken 
          });
        } catch (error: any) {
          set({ user: null, accessToken: null, isAuthenticated: false, loading: false });
        }
      },

      login: () => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const frontendUrl = window.location.origin;
        const popup = window.open(
          `${apiUrl}/auth/google`,
          'google-auth',
          'width=500,height=600,left=' + (window.screen.width / 2 - 250) + ',top=' + (window.screen.height / 2 - 300)
        );

        const checkPopup = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkPopup);
          }
        }, 1000);
      },

      logout: () => {
        set({ user: null, accessToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);

