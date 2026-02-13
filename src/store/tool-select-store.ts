import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ToolKey, ALL_TOOL_KEYS } from "@/ai/tools";

interface ToolSelectStore {
  enabledTools: ToolKey[];
  toggleTool: (key: ToolKey) => void;
  setEnabledTools: (keys: ToolKey[]) => void;
  isToolEnabled: (key: ToolKey) => boolean;
  enableAll: () => void;
  disableAll: () => void;
}

export const useToolSelectStore = create<ToolSelectStore>()(
  persist(
    (set, get) => ({
      enabledTools: [...ALL_TOOL_KEYS],

      toggleTool: (key) =>
        set((state) => {
          const isEnabled = state.enabledTools.includes(key);
          return {
            enabledTools: isEnabled
              ? state.enabledTools.filter((k) => k !== key)
              : [...state.enabledTools, key],
          };
        }),

      setEnabledTools: (keys) => set({ enabledTools: keys }),

      isToolEnabled: (key) => get().enabledTools.includes(key),

      enableAll: () => set({ enabledTools: [...ALL_TOOL_KEYS] }),

      disableAll: () => set({ enabledTools: [] }),
    }),
    {
      name: "tool-select-store",
    },
  ),
);
