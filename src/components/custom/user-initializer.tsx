"use client";

import { useEffect } from "react";
import { User } from "@/types/user";
import { useUserStore } from "@/store/user";

interface UserInitializerProps {
  user: User | null;
}

export default function UserInitializer({ user }: UserInitializerProps) {
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    setUser(user);
  }, [user, setUser]);

  return null;
}
