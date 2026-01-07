import { Chatdata, ModelInfo } from "@/types/chat";
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
  currentModelId: string;
  modelList: ModelInfo[];
  setCurrentModelId: (modelId: string) => void;
  setModelList: (modelList: ModelInfo[]) => void;
}

export const useModelStore = create<ModelStoreProps>()((set) => ({
  currentModelId: "ep-20251203173341-sztlm",
  modelList: [
    {
      id: "ep-20251203173341-sztlm",
      name: "Kimi-K2",
      description: "Kimi-K2",
      apiKey: process.env.AI_GATEWAY_API_KEY as string,
      baseURL: "https://ark.cn-beijing.volces.com/api/v3",
    },
    {
      id: "ep-20251124145531-b7dkr",
      name: "Doubao-Seed-1.6(深度思考)",
      description: "豆包大模型",
      apiKey: process.env.AI_GATEWAY_API_KEY as string,
      baseURL: "https://ark.cn-beijing.volces.com/api/v3",
    },
    {
      id: "ep-20251120155412-jmc8q",
      name: "Doubao-lite-32k",
      description: "豆包大模型",
      apiKey: process.env.AI_GATEWAY_API_KEY as string,
      baseURL: "https://ark.cn-beijing.volces.com/api/v3",
    },
  ],
  setCurrentModelId: (modelId) => set({ currentModelId: modelId }),
  setModelList: (modelList) => set({ modelList }),
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
