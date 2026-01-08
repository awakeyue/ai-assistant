import { Chatdata, UserModelConfig } from "@/types/chat";
import { create } from "zustand";

interface ChatHistoryStoreProps {
  chatHistorys: Chatdata[];
  currentChatId: string | null;
  isLoading: boolean;
  setCurrentChatId: (chatId: string | null) => void;
  setChatHistory: (history: Chatdata[]) => void;
  setChatMessages: (chatId: string, messages: Chatdata["messages"]) => void;
  setLoading: (loading: boolean) => void;
  addChat: (chat: Chatdata) => void;
  updateChatTitle: (chatId: string, title: string) => void;
  removeChat: (chatId: string) => void;
}

export const useChatHistoryStore = create<ChatHistoryStoreProps>()((set) => ({
  chatHistorys: [],
  currentChatId: null,
  isLoading: true,

  setCurrentChatId: (chatId) => set({ currentChatId: chatId }),

  setChatHistory: (historys) =>
    set({ chatHistorys: historys, isLoading: false }),

  setChatMessages: (chatId, messages) =>
    set((state) => ({
      chatHistorys: state.chatHistorys.map((history) =>
        history.id === chatId ? { ...history, messages } : history,
      ),
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  addChat: (chat) =>
    set((state) => ({
      chatHistorys: [...state.chatHistorys, chat],
    })),

  updateChatTitle: (chatId, title) =>
    set((state) => ({
      chatHistorys: state.chatHistorys.map((history) =>
        history.id === chatId ? { ...history, title } : history,
      ),
    })),

  removeChat: (chatId) =>
    set((state) => ({
      chatHistorys: state.chatHistorys.filter((chat) => chat.id !== chatId),
      currentChatId:
        state.currentChatId === chatId ? null : state.currentChatId,
    })),
}));

interface ModelStoreProps {
  currentModelId: string | null;
  modelList: UserModelConfig[];
  isLoading: boolean;
  error: string | null;
  setCurrentModelId: (modelId: string) => void;
  setModelList: (modelList: UserModelConfig[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchModels: () => Promise<void>;
  addModel: (model: UserModelConfig) => void;
  updateModel: (id: string, model: Partial<UserModelConfig>) => void;
  removeModel: (id: string) => void;
  setDefaultModel: (id: string) => void;
}

export const useModelStore = create<ModelStoreProps>()((set, get) => ({
  currentModelId: null,
  modelList: [],
  isLoading: true,
  error: null,

  setCurrentModelId: (modelId) => set({ currentModelId: modelId }),

  setModelList: (modelList) => {
    // If currentModelId is not set or not in the list, set to default model
    const state = get();
    let newCurrentModelId = state.currentModelId;

    if (modelList.length > 0) {
      const currentExists = modelList.some(
        (m) => m.id === state.currentModelId,
      );
      if (!currentExists) {
        const defaultModel = modelList.find((m) => m.isDefault);
        newCurrentModelId = defaultModel?.id || modelList[0]?.id || null;
      }
    } else {
      newCurrentModelId = null;
    }

    set({ modelList, currentModelId: newCurrentModelId });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  fetchModels: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/models");
      if (!response.ok) {
        if (response.status === 401) {
          set({ modelList: [], isLoading: false, currentModelId: null });
          return;
        }
        throw new Error("Failed to fetch models");
      }
      const models: UserModelConfig[] = await response.json();
      get().setModelList(models);
      set({ isLoading: false });
    } catch (error) {
      console.error("Failed to fetch models:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch models",
        isLoading: false,
      });
    }
  },

  addModel: (model) =>
    set((state) => {
      const newList = [...state.modelList, model];
      // If this is the first model, set it as current
      const newCurrentId =
        state.currentModelId ||
        (model.isDefault ? model.id : state.currentModelId);
      return { modelList: newList, currentModelId: newCurrentId || model.id };
    }),

  updateModel: (id, updates) =>
    set((state) => ({
      modelList: state.modelList.map((model) =>
        model.id === id ? { ...model, ...updates } : model,
      ),
    })),

  removeModel: (id) =>
    set((state) => {
      const newList = state.modelList.filter((model) => model.id !== id);
      let newCurrentId = state.currentModelId;

      // If removed model was current, switch to default or first
      if (state.currentModelId === id) {
        const defaultModel = newList.find((m) => m.isDefault);
        newCurrentId = defaultModel?.id || newList[0]?.id || null;
      }

      return { modelList: newList, currentModelId: newCurrentId };
    }),

  setDefaultModel: (id) =>
    set((state) => ({
      modelList: state.modelList.map((model) => ({
        ...model,
        isDefault: model.id === id,
      })),
    })),
}));

interface ChatStatusStore {
  createdChatIds: Record<string, boolean>;
  markAsCreated: (chatId: string) => void;
  resetKey: number;
  triggerReset: () => void;
}

export const useChatStatusStore = create<ChatStatusStore>((set) => ({
  createdChatIds: {},
  markAsCreated: (chatId) =>
    set((state) => ({
      createdChatIds: { ...state.createdChatIds, [chatId]: true },
    })),
  resetKey: 0,
  triggerReset: () => set((state) => ({ resetKey: state.resetKey + 1 })),
}));
