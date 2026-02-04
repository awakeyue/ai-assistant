"use client";

import { LogOut } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User as UserInfo } from "@/types/user";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface HeaderUserMenuProps {
  user: UserInfo;
}

/**
 * Get user initials from name or email
 */
const getInitials = (name: string | null, email: string) => {
  if (name) {
    return name.charAt(0).toUpperCase();
  }
  return email.charAt(0).toUpperCase();
};

export default function HeaderUserMenu({ user }: HeaderUserMenuProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.refresh();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsLoading(false);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 px-2"
        >
          <Avatar className="h-6 w-6">
            <AvatarImage
              src={user.avatarUrl || undefined}
              alt={user.name || "用户"}
            />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-[100px] truncate text-sm">
            {user.name || user.email.split("@")[0]}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-0">
        <div className="border-b px-3 py-2">
          <p className="text-sm font-medium">{user.name || "用户"}</p>
          <p className="text-muted-foreground text-xs">{user.email}</p>
        </div>
        <div className="p-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-red-600 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
            onClick={handleSignOut}
            disabled={isLoading}
          >
            <LogOut size={16} />
            {isLoading ? "退出中..." : "退出登录"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
