"use client";

import { LogOut, User, Settings2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { User as UserInfo } from "@/types/user";

interface SidebarUserMenuProps {
  user: UserInfo | null;
  isSidebarCollapsed: boolean;
  inSheet?: boolean;
  onSignOut: () => void;
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

export default function SidebarUserMenu({
  user,
  isSidebarCollapsed,
  inSheet = false,
  onSignOut,
}: SidebarUserMenuProps) {
  return (
    <div className="border-sidebar-border border-t p-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "hover:bg-sidebar-accent flex w-full items-center gap-3 rounded-lg p-2 transition-colors",
              !inSheet && isSidebarCollapsed ? "justify-center" : "",
            )}
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage
                src={user?.avatarUrl || undefined}
                alt={user?.name || "用户"}
              />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {user ? getInitials(user.name, user.email) : <User size={16} />}
              </AvatarFallback>
            </Avatar>
            {(inSheet || !isSidebarCollapsed) && (
              <div className="flex flex-1 flex-col items-start overflow-hidden">
                <span className="text-sidebar-foreground w-full truncate text-left text-sm font-medium">
                  {user?.name || "用户"}
                </span>
                <span className="text-sidebar-foreground/60 w-full truncate text-left text-xs">
                  {user?.email}
                </span>
              </div>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{user?.name || "用户"}</p>
            <p className="text-muted-foreground text-xs">{user?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => (window.location.href = "/settings/models")}
            className="flex cursor-pointer items-center gap-2"
          >
            <Settings2 size={16} />
            模型管理
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onSignOut}
            className="flex cursor-pointer items-center gap-2 text-red-600 focus:text-red-600"
          >
            <LogOut size={16} />
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
