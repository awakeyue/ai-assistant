"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Trash2,
  Loader2,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { searchUserChats, deleteChat } from "@/actions/chat";
import { useModelStore } from "@/store/chat";

interface ChatItem {
  id: string;
  title: string;
  modelId: string;
  createdAt: Date;
  updatedAt: Date;
  preview: string;
}

const PAGE_SIZE = 20;

export default function ChatHistoryManager() {
  const router = useRouter();
  const { setCurrentModelId } = useModelStore();

  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  // Initial load & keyword change
  const fetchChats = useCallback(
    async (pageNum: number, isLoadMore = false) => {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      try {
        const result = await searchUserChats({
          keyword,
          page: pageNum,
          pageSize: PAGE_SIZE,
        });
        if (isLoadMore) {
          setChats((prev) => [...prev, ...result.chats]);
        } else {
          setChats(result.chats);
        }
        setHasMore(result.hasMore);
      } finally {
        if (isLoadMore) {
          setIsLoadingMore(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [keyword],
  );

  // Reset when keyword changes
  useEffect(() => {
    setPage(1);
    setChats([]);
    setHasMore(true);
    fetchChats(1, false);
  }, [keyword]); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const trigger = loadMoreTriggerRef.current;
    if (!trigger) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isLoading &&
          !isLoadingMore
        ) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchChats(nextPage, true);
        }
      },
      {
        root: scrollContainerRef.current,
        threshold: 0.1,
      },
    );

    observer.observe(trigger);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, page, fetchChats]);

  const handleSearch = () => {
    setKeyword(searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleOpenChat = (chatId: string, modelId: string) => {
    setCurrentModelId(modelId);
    router.push(`/chat/${chatId}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    setDeletingId(chatId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deleteChat(deletingId);
      // Remove from local state (optimistic)
      setChats((prev) => prev.filter((c) => c.id !== deletingId));
      setDeleteDialogOpen(false);
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Group chats by date
  const groupedChats = groupChatsByDate(chats);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-4 pt-8 pb-2 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-lg"
              onClick={() => router.push("/chat")}
              className="shrink-0"
            >
              <ArrowLeft />
            </Button>
            <h1 className="text-2xl font-bold">历史会话</h1>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search
              size={18}
              className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
            />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="搜索历史会话"
              className="bg-muted/50 h-11 rounded-xl border-none pl-10 text-base shadow-none"
            />
          </div>
        </div>
      </div>

      {/* Chat list - scrollable area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 pt-4 pb-8 sm:px-8"
      >
        <div className="mx-auto max-w-3xl">
          {isLoading ? (
            <div className="space-y-4 pt-8">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-muted/30 h-20 animate-pulse rounded-xl"
                />
              ))}
            </div>
          ) : chats.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center pt-20">
              <MessageSquare size={48} className="mb-4 opacity-20" />
              <p className="text-sm">
                {keyword ? "未找到匹配的会话" : "暂无会话记录"}
              </p>
            </div>
          ) : (
            <>
              {groupedChats.map((group) => (
                <div key={group.label} className="mb-6">
                  {/* Date group label */}
                  <div className="text-muted-foreground mb-3 px-1 text-xs font-medium">
                    {group.label}
                  </div>

                  {/* Chat cards */}
                  <div className="space-y-1">
                    {group.items.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => handleOpenChat(chat.id, chat.modelId)}
                        className="group hover:bg-muted/50 relative flex cursor-pointer items-start gap-3 rounded-xl px-3 py-3.5 transition-colors"
                      >
                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <h3 className="truncate text-sm font-medium">
                              {chat.title || "新对话"}
                            </h3>
                            <span className="text-muted-foreground shrink-0 text-xs">
                              {formatDate(chat.updatedAt)}
                            </span>
                          </div>
                          {chat.preview && (
                            <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
                              {chat.preview}
                            </p>
                          )}
                        </div>

                        {/* Actions - visible on hover */}
                        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => handleDeleteClick(e, chat.id)}
                            title="删除"
                          >
                            <Trash2
                              size={14}
                              className="text-muted-foreground hover:text-red-600"
                            />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Load more trigger */}
              <div ref={loadMoreTriggerRef} className="py-4">
                {isLoadingMore && (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-muted-foreground text-xs">
                      加载更多...
                    </span>
                  </div>
                )}
                {!hasMore && chats.length > 0 && (
                  <p className="text-muted-foreground text-center text-xs">
                    已加载全部会话
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这条对话吗？删除后将无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={14} className="mr-1 animate-spin" />
                  删除中...
                </>
              ) : (
                "删除"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Group chats by relative date labels
 */
function groupChatsByDate(chats: ChatItem[]) {
  const groups: { label: string; items: ChatItem[] }[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const thisWeekStart = new Date(today.getTime() - today.getDay() * 86400000);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const groupMap = new Map<string, ChatItem[]>();

  for (const chat of chats) {
    const chatDate = new Date(chat.updatedAt);
    const chatDay = new Date(
      chatDate.getFullYear(),
      chatDate.getMonth(),
      chatDate.getDate(),
    );

    let label: string;
    if (chatDay >= today) {
      label = "今天";
    } else if (chatDay >= yesterday) {
      label = "昨天";
    } else if (chatDay >= thisWeekStart) {
      label = "本周";
    } else if (chatDay >= thisMonthStart) {
      label = "本月";
    } else {
      // Format as "YYYY年MM月"
      label = `${chatDate.getFullYear()}年${String(chatDate.getMonth() + 1).padStart(2, "0")}月`;
    }

    if (!groupMap.has(label)) {
      groupMap.set(label, []);
    }
    groupMap.get(label)!.push(chat);
  }

  // Convert map to array preserving insertion order
  for (const [label, items] of groupMap) {
    groups.push({ label, items });
  }

  return groups;
}
