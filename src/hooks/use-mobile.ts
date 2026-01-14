"use client";

import { useUIStore } from "@/store/ui-store";

const MOBILE_BREAKPOINT = 768;

/**
 * @deprecated Use `useUIStore((state) => state.isMobile)` instead.
 * This hook is kept for backward compatibility.
 * The isMobile state is now managed by zustand in ui-store.
 */
export function useIsMobile() {
  const isMobile = useUIStore((state) => state.isMobile);
  return isMobile;
}

export { MOBILE_BREAKPOINT };
