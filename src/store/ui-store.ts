import { create } from "zustand";

const MOBILE_BREAKPOINT = 768;

interface UIStore {
  // Mobile detection state
  isMobile: boolean;
  setIsMobile: (isMobile: boolean) => void;
  initMobileListener: () => () => void;
  // Sidebar state
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
  // Mobile detection state
  isMobile: false,
  setIsMobile: (isMobile) => set({ isMobile }),
  initMobileListener: () => {
    // Check if window is available (client-side)
    if (typeof window === "undefined") {
      return () => {};
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const onChange = () => {
      set({ isMobile: window.innerWidth < MOBILE_BREAKPOINT });
    };

    // Set initial value
    onChange();

    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  },
  // Sidebar state
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
