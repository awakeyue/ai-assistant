import { create } from "zustand";

interface UIStore {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  // Navigation state for loading feedback
  isNavigating: boolean;
  navigatingToChatId: string | null;
  setNavigating: (isNavigating: boolean, chatId?: string | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isSidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  // Navigation state
  isNavigating: false,
  navigatingToChatId: null,
  setNavigating: (isNavigating, chatId = null) =>
    set({ isNavigating, navigatingToChatId: chatId }),
}));
