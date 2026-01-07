import { create } from "zustand";

interface UIStore {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  // Mobile sidebar drawer state
  isMobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
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
  // Mobile sidebar drawer state
  isMobileSidebarOpen: false,
  setMobileSidebarOpen: (open) => set({ isMobileSidebarOpen: open }),
  toggleMobileSidebar: () =>
    set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
  // Navigation state
  isNavigating: false,
  navigatingToChatId: null,
  setNavigating: (isNavigating, chatId = null) =>
    set({ isNavigating, navigatingToChatId: chatId }),
}));
