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
        if (token) {
          localStorage.setItem('access_token', token);
        } else {
          localStorage.removeItem('access_token');
        }
      },

      setLoading: (loading) => set({ loading }),

      fetchUser: async () => {
        const { accessToken } = get();
        const token = accessToken || localStorage.getItem('access_token');
        
        if (!token) {
          set({ loading: false, isAuthenticated: false });
          return;
        }

        try {
          console.log('Fetching user with token:', token.substring(0, 20) + '...');
          const response = await api.get('/auth/me');
          console.log('User fetched successfully:', response.data);
          set({ 
            user: response.data, 
            isAuthenticated: true, 
            loading: false,
            accessToken: token 
          });
        } catch (error: any) {
          console.error('Error fetching user:', error.response?.data || error.message);
          set({ user: null, accessToken: null, isAuthenticated: false, loading: false });
          localStorage.removeItem('access_token');
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
        localStorage.removeItem('access_token');
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

