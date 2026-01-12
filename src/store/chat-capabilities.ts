import { create } from "zustand";
import { ChatCapabilities } from "@/types/chat";

interface ChatCapabilitiesStore extends ChatCapabilities {
  // Actions
  setEnableVision: (enabled: boolean) => void;
  toggleVision: () => void;
  resetCapabilities: () => void;
  getCapabilities: () => ChatCapabilities;
}

const defaultCapabilities: ChatCapabilities = {
  enableVision: false,
};

export const useChatCapabilitiesStore = create<ChatCapabilitiesStore>()(
  (set, get) => ({
    ...defaultCapabilities,

    setEnableVision: (enabled) => set({ enableVision: enabled }),

    toggleVision: () => set((state) => ({ enableVision: !state.enableVision })),

    resetCapabilities: () => set(defaultCapabilities),

    getCapabilities: () => {
      const { enableVision } = get();
      return { enableVision };
    },
  }),
);
