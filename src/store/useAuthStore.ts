import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

interface AuthState {
  user: User | null;
  userRole: 'admin' | 'user' | 'guest' | null;
  isAuthReady: boolean;
  localGuest: boolean;
  setUser: (user: User | null) => void;
  setUserRole: (role: 'admin' | 'user' | 'guest' | null) => void;
  setAuthReady: (ready: boolean) => void;
  setLocalGuest: (isGuest: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      userRole: null,
      isAuthReady: false,
      localGuest: false,
      setUser: (user) => set({ user }),
      setUserRole: (role) => set({ userRole: role }),
      setAuthReady: (ready) => set({ isAuthReady: ready }),
      setLocalGuest: (isGuest) => set({ localGuest: isGuest }),
      logout: async () => {
        set({ user: null, userRole: null, localGuest: false });
        try {
          await signOut(auth);
        } catch (error) {
          console.error('Error signing out:', error);
        }
      },
    }),
    {
      name: 'imperial-auth-storage',
      // Persist role and guest status for immediate UI feedback
      partialize: (state) => ({ 
        userRole: state.userRole, 
        localGuest: state.localGuest
      }),
    }
  )
);
