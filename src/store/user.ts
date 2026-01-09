import { create } from "zustand";
import { User } from "@/types/user";

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
  isAdmin: () => boolean;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,

  setUser: (user) => set({ user }),

  isAdmin: () => get().user?.role === "admin",
}));
