import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchMenuFromApi, MenuItem } from '../services/menuService';

interface MenuState {
  items: MenuItem[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  lastFetch: number | null;
  fetchMenu: () => Promise<void>;
  forceFetchMenu: () => Promise<void>;
}

export const useMenuStore = create<MenuState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      isLoaded: false,
      error: null,
      lastFetch: null,
      fetchMenu: async () => {
        if (get().isLoading) return;
        
        // Prevent spamming the API on rapid navigation (1 minute cache)
        const now = Date.now();
        const lastFetch = get().lastFetch;
        if (lastFetch && now - lastFetch < 60 * 1000 && get().items.length > 0) {
          return;
        }
        
        set({ isLoading: true, error: null });
        try {
          const items = await fetchMenuFromApi();
          set({ items, isLoaded: true, isLoading: false, lastFetch: Date.now() });
        } catch (error) {
          set({ error: 'Error al cargar el menú', isLoading: false });
        }
      },
      forceFetchMenu: async () => {
        if (get().isLoading) return;
        
        set({ isLoading: true, error: null });
        try {
          const items = await fetchMenuFromApi();
          set({ items, isLoaded: true, isLoading: false, lastFetch: Date.now() });
        } catch (error) {
          set({ error: 'Error al cargar el menú', isLoading: false });
        }
      },
    }),
    {
      name: 'imperial-menu-storage',
      partialize: (state) => ({ 
        items: state.items,
        lastFetch: state.lastFetch,
        isLoaded: state.items.length > 0
      }),
    }
  )
);
