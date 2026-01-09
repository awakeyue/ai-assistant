"use client";

import {
  Plus,
  Trash2,
  MoreVertical,
  Loader2,
  PanelLeft,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useModelStore, useChatStatusStore } from "@/store/chat";
import { deleteChat, getUserChatList, updateChatTitle } from "@/actions/chat";
import { signOut } from "@/actions/auth";
import { useRouter, usePathname } from "next/navigation";
import useSWR from "swr";
import { useUIStore } from "@/store/ui-store";
import { useTransition, useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { User as UserInfo } from "@/types/user";
import { useUserStore } from "@/store/user";
import SidebarUserMenu from "./sidebar-user-menu";
import { Skeleton } from "@/components/ui/skeleton";

// Sidebar content component to avoid duplication
interface SidebarContentProps {
  inSheet?: boolean;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  handleCreateChat: () => void;
  isLoading: boolean;
  navigatingToChatId: string | null;
  chatHistorys: any[];
  currentChatId: string | null;
  handleSelectChat: (chatId: string, modelId: string) => void;
  handleDeleteChatHistory: (chatId: string) => void;
  handleRenameChat: (chatId: string, currentTitle: string) => void;
  user: UserInfo | null;
  handleSignOut: () => void;
  isLoadingChatList: boolean;
}

const SidebarContent = ({
  inSheet = false,
  isSidebarCollapsed,
  toggleSidebar,
  handleCreateChat,
  isLoading,
  navigatingToChatId,
  chatHistorys,
  currentChatId,
  handleSelectChat,
  handleDeleteChatHistory,
  handleRenameChat,
  user,
  handleSignOut,
  isLoadingChatList,
}: SidebarContentProps) => (
  <div
    className={cn(
      "bg-sidebar flex h-full flex-col",
      !inSheet && "border-sidebar-border border-r transition-all duration-300",
      !inSheet && (isSidebarCollapsed ? "w-16" : "w-64"),
      inSheet && "w-full",
    )}
  >
    {/* Header */}
    <div className="border-sidebar-border space-y-3 border-b p-4">
      <div className="flex items-center justify-between">
        {(!isSidebarCollapsed || inSheet) && (
          <div className="flex items-center gap-2">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold">
              AI
            </div>
            <span className="text-sidebar-foreground flex-1 font-semibold">
              Chat
            </span>
          </div>
        )}
        {/* Hide collapse button in sheet mode */}
        {!inSheet && (
          <Button
            onClick={toggleSidebar}
            variant="ghost"
            size="sm"
            className={cn(
              "shrink-0",
              isSidebarCollapsed ? "w-full justify-center" : "",
            )}
            title={isSidebarCollapsed ? "Expand" : "Collapse"}
          >
            <PanelLeft size={18} />
          </Button>
        )}
      </div>

      {/* New Chat button */}
      <Button
        onClick={handleCreateChat}
        variant="outline"
        size="sm"
        disabled={isLoading && navigatingToChatId === null}
        className={cn(
          "w-full gap-2",
          !inSheet && isSidebarCollapsed
            ? "justify-center px-0"
            : "justify-start",
        )}
        title={!inSheet && isSidebarCollapsed ? "新建聊天" : ""}
      >
        {isLoading && navigatingToChatId === null ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Plus size={18} />
        )}
        {(inSheet || !isSidebarCollapsed) && "新建聊天"}
      </Button>
    </div>

    {/* Chat History */}
    <div className="flex flex-1 flex-col overflow-hidden">
      {(inSheet || !isSidebarCollapsed) && (
        <>
          <div className="px-4 py-3">
            <p className="text-sidebar-foreground/70 text-xs font-semibold uppercase">
              更早
            </p>
          </div>
          <ScrollArea className="flex-1 overflow-auto">
            {isLoadingChatList ? (
              <ChatHistorySkeleton />
            ) : (
              <div className="space-y-1 px-2">
                {chatHistorys?.map((chatData) => {
                  const isLoadingThisChat = navigatingToChatId === chatData.id;
                  const isActive = currentChatId === chatData.id;

                  return (
                    <div
                      key={chatData.id}
                      className={cn(
                        "group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 transition-all",
                        isActive
                          ? "bg-sidebar-primary/20 text-sidebar-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent",
                        isLoadingThisChat && "opacity-70",
                      )}
                      title={chatData.title}
                      onClick={() =>
                        handleSelectChat(chatData.id, chatData.modelId)
                      }
                    >
                      {/* Loading indicator for navigating chat */}
                      {isLoadingThisChat && (
                        <Loader2 size={14} className="shrink-0 animate-spin" />
                      )}
                      <div className="w-0 flex-1 truncate text-left text-sm">
                        {chatData.title || "新对话"}
                      </div>
                      {!isLoadingThisChat && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="opacity-0 transition-opacity group-hover:opacity-100">
                              <MoreVertical size={16} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRenameChat(chatData.id, chatData.title);
                              }}
                              className="flex cursor-pointer items-center gap-2"
                            >
                              <Pencil size={16} />
                              重命名
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteChatHistory(chatData.id);
                              }}
                              className="flex cursor-pointer items-center gap-2 text-red-600"
                            >
                              <Trash2 size={16} />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </>
      )}
    </div>

    {/* Footer - User Menu */}
    <SidebarUserMenu
      user={user}
      isSidebarCollapsed={isSidebarCollapsed}
      inSheet={inSheet}
      onSignOut={handleSignOut}
    />
  </div>
);

export default function Sidebar() {
  const {
    isSidebarCollapsed,
    toggleSidebar,
    isNavigating,
    navigatingToChatId,
    setNavigating,
    isMobileSidebarOpen,
    setMobileSidebarOpen,
  } = useUIStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const isMobile = useIsMobile();
  const { user } = useUserStore();

  // Rename dialog state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // Extract chatId from pathname like /chat/xxx
  const currentChatId = pathname.startsWith("/chat/")
    ? pathname.slice(6)
    : null;

  const { setCurrentModelId, modelList, fetchModels } = useModelStore();
  const { triggerReset } = useChatStatusStore();

  // Load models when component mounts (user logs in)
  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Use SWR to fetch chat list
  const {
    data: chatHistorys,
    mutate,
    isLoading: isLoadingChatList,
  } = useSWR("chat-list", getUserChatList, {
    fallbackData: [],
    revalidateOnFocus: false,
  });

  // Close mobile sidebar when pathname changes (navigation completed)
  useEffect(() => {
    if (isMobile) {
      setMobileSidebarOpen(false);
    }
  }, [pathname, isMobile, setMobileSidebarOpen]);

  const handleCreateChat = () => {
    // Immediate UI feedback - set navigating state
    setNavigating(true, null);

    if (modelList.length > 0) {
      setCurrentModelId(modelList[0].id);
    }
    triggerReset();

    // Use startTransition for non-blocking navigation
    startTransition(() => {
      router.push("/chat");
    });

    if (isMobile) {
      setMobileSidebarOpen(false);
    }

    setNavigating(false);
  };

  const handleSelectChat = (chatId: string, modelId: string) => {
    // Skip if already on this chat or navigating to it
    if (chatId === currentChatId || navigatingToChatId === chatId) {
      return;
    }

    // Immediate UI feedback
    setNavigating(true, chatId);
    setCurrentModelId(modelId);

    // Use startTransition for non-blocking navigation
    startTransition(() => {
      router.push(`/chat/${chatId}`);
    });
  };

  const handleDeleteChatHistory = async (chatId: string) => {
    await deleteChat(chatId);
    mutate(); // Refresh the list
    if (chatId === currentChatId) {
      router.push("/chat");
    }
  };

  const handleRenameChat = (chatId: string, currentTitle: string) => {
    setRenamingChatId(chatId);
    setNewTitle(currentTitle || "");
    setRenameDialogOpen(true);
  };

  const handleConfirmRename = async () => {
    if (!renamingChatId || !newTitle.trim()) return;

    setIsRenaming(true);
    try {
      await updateChatTitle(renamingChatId, newTitle.trim());
      mutate(); // Refresh the list
      setRenameDialogOpen(false);
      setRenamingChatId(null);
      setNewTitle("");
    } finally {
      setIsRenaming(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // Check if currently loading (either transitioning or navigating)
  const isLoading = isPending || isNavigating;

  // Rename dialog component
  const RenameDialog = (
    <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>重命名对话</DialogTitle>
          <DialogDescription>请输入新的对话标题</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="请输入标题"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isRenaming) {
                handleConfirmRename();
              }
            }}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setRenameDialogOpen(false)}
            disabled={isRenaming}
          >
            取消
          </Button>
          <Button
            onClick={handleConfirmRename}
            disabled={isRenaming || !newTitle.trim()}
          >
            {isRenaming ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              "确定"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Mobile: Show only trigger button and drawer
  if (isMobile) {
    return (
      <>
        {/* Mobile trigger button - fixed position */}
        <Button
          onClick={() => setMobileSidebarOpen(true)}
          variant="ghost"
          size="sm"
          className="fixed top-3 left-3 z-40 h-9 w-9 p-0 md:hidden"
          aria-label="Open sidebar"
        >
          <PanelLeft size={20} />
        </Button>

        {/* Mobile drawer */}
        <Sheet open={isMobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" className="w-72 p-0" hideCloseButton>
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SidebarContent
              inSheet
              isSidebarCollapsed={isSidebarCollapsed}
              toggleSidebar={toggleSidebar}
              handleCreateChat={handleCreateChat}
              isLoading={isLoading}
              navigatingToChatId={navigatingToChatId}
              chatHistorys={chatHistorys || []}
              currentChatId={currentChatId}
              handleSelectChat={handleSelectChat}
              handleDeleteChatHistory={handleDeleteChatHistory}
              handleRenameChat={handleRenameChat}
              user={user}
              handleSignOut={handleSignOut}
              isLoadingChatList={isLoadingChatList}
            />
          </SheetContent>
        </Sheet>
        {RenameDialog}
      </>
    );
  }

  // Desktop: Show regular sidebar
  return (
    <>
      <SidebarContent
        isSidebarCollapsed={isSidebarCollapsed}
        toggleSidebar={toggleSidebar}
        handleCreateChat={handleCreateChat}
        isLoading={isLoading}
        navigatingToChatId={navigatingToChatId}
        chatHistorys={chatHistorys || []}
        currentChatId={currentChatId}
        handleSelectChat={handleSelectChat}
        handleDeleteChatHistory={handleDeleteChatHistory}
        handleRenameChat={handleRenameChat}
        user={user}
        handleSignOut={handleSignOut}
        isLoadingChatList={isLoadingChatList}
      />
      {RenameDialog}
    </>
  );
}

function ChatHistorySkeleton() {
  return (
    <div className="flex w-full flex-col gap-4 px-2 py-2">
      <Skeleton className="h-6 w-[70%] rounded-lg" />
      <Skeleton className="h-6 w-[75%] rounded-lg" />
      <Skeleton className="h-6 w-[68%] rounded-lg" />
      <Skeleton className="h-6 w-[70%] rounded-lg" />
      <Skeleton className="h-6 w-[73%] rounded-lg" />
    </div>
  );
}
