import { create } from "zustand";

/**
 * Generic tool state store for persisting tool output state
 * This store provides a centralized way for tool components to update their state
 * which will be persisted in the message parts
 */

// Callback type for updating tool state
type ToolStateUpdateCallback = (
  toolCallId: string,
  state: Record<string, unknown>,
) => void;

interface ToolStateStore {
  // The callback registered by ChatArea to handle state updates
  onToolStateChange: ToolStateUpdateCallback | null;

  // Register the callback (called by ChatArea)
  setOnToolStateChange: (callback: ToolStateUpdateCallback | null) => void;

  // Update tool state (called by tool components)
  updateToolState: (toolCallId: string, state: Record<string, unknown>) => void;
}

export const useToolStateStore = create<ToolStateStore>((set, get) => ({
  onToolStateChange: null,

  setOnToolStateChange: (callback) => {
    set({ onToolStateChange: callback });
  },

  updateToolState: (toolCallId, state) => {
    const { onToolStateChange } = get();
    if (onToolStateChange) {
      onToolStateChange(toolCallId, state);
    }
  },
}));
