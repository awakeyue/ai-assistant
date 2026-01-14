"use client";

import { useEffect } from "react";
import { useUIStore } from "@/store/ui-store";

/**
 * Component to initialize mobile detection state on app startup
 * Should be placed in the root layout
 */
export default function MobileInitializer() {
  const initMobileListener = useUIStore((state) => state.initMobileListener);

  useEffect(() => {
    const cleanup = initMobileListener();
    return cleanup;
  }, [initMobileListener]);

  return null;
}
