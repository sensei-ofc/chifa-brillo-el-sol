import { create } from 'zustand';

interface UIState {
  isDarkMode: boolean;
  isSidebarOpen: boolean;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

// Helper to get initial theme
const getInitialTheme = () => {
  if (typeof window === 'undefined') return true;
  const savedTheme = localStorage.getItem('imperial-theme');
  if (savedTheme) {
    return savedTheme === 'dark';
  }
  // Default to dark mode as specified for the "Imperial" look
  return true;
};

// Apply theme to document
const applyTheme = (isDark: boolean) => {
  if (typeof window === 'undefined') return;
  if (isDark) {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
  }
};

// Initialize theme immediately to avoid flash
const initialDarkMode = getInitialTheme();
applyTheme(initialDarkMode);

export const useUIStore = create<UIState>((set) => ({
  isDarkMode: initialDarkMode,
  isSidebarOpen: false,
  toggleDarkMode: () => set((state) => {
    const newMode = !state.isDarkMode;
    localStorage.setItem('imperial-theme', newMode ? 'dark' : 'light');
    applyTheme(newMode);
    return { isDarkMode: newMode };
  }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  closeSidebar: () => set({ isSidebarOpen: false }),
}));
