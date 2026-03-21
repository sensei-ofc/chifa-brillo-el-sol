import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: 'admin' | 'user' | 'guest';
  points: number;
  rank: string;
  examsCompleted: number;
  accuracy: number;
  achievements: string[];
  currentStreak: number;
  bestStreak: number;
  perfectExams: number;
  bestTime: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

interface AppState {
  profile: UserProfile | null;
  notifications: Notification[];
  isQuizInProgress: boolean;
  setProfile: (profile: UserProfile | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updatePoints: (points: number) => void;
  setQuizInProgress: (inProgress: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      profile: null,
      notifications: [
        {
          id: '1',
          title: 'Bienvenido',
          message: 'Bienvenido al Sistema Imperial de Chifa Brillo El Sol.',
          type: 'success',
          timestamp: new Date().toISOString(),
          read: false,
        },
        {
          id: '2',
          title: 'Actualización',
          message: 'Se han añadido nuevas funciones de gestión de usuarios.',
          type: 'info',
          timestamp: new Date().toISOString(),
          read: false,
        }
      ],
      isQuizInProgress: false,
      setProfile: (profile) => set({ profile }),
      updateProfile: (updates) => set((state) => {
        if (!state.profile) return state;
        return {
          profile: {
            ...state.profile,
            ...updates,
          }
        };
      }),
      updatePoints: (points) => set((state) => {
        if (!state.profile) return state;
        return {
          profile: {
            ...state.profile,
            points: state.profile.points + points,
          }
        };
      }),
      setQuizInProgress: (inProgress) => set({ isQuizInProgress: inProgress }),
      addNotification: (n) => set((state) => ({
        notifications: [
          {
            ...n,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            read: false,
          },
          ...state.notifications,
        ],
      })),
      markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
      })),
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'imperial-app-storage',
      partialize: (state) => ({
        profile: state.profile,
        notifications: state.notifications,
      }),
    }
  )
);
