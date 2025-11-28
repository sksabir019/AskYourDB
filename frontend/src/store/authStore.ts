import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isInitialized: false,
      initialize: () => {
        const state = get();
        
        // Use persisted state from Zustand
        if (state.token && state.user) {
          set({ isAuthenticated: true, isInitialized: true });
        } else {
          // Clean up if incomplete state
          set({ token: null, user: null, isAuthenticated: false, isInitialized: true });
        }
      },
      login: (token, user) => {
        set({ token, user, isAuthenticated: true, isInitialized: true });
      },
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);
