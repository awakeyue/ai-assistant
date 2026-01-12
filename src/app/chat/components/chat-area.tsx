"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import ChatMessage from "./chat-message";
import EmptyState from "./empty-state";
import InputBox from "./input-box";
import { useModelStore, useChatStatusStore } from "@/store/chat";
import { useChatCapabilitiesStore } from "@/store/chat-capabilities";
import { DefaultChatTransport } from "ai";
import { AlertCircleIcon, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { convertFileToUIPart } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { saveChatMessages, createChat, updateChatTitle } from "@/actions/chat";
import { useSWRConfig } from "swr";
import type { UIMessage } from "ai";
import { nanoid } from "nanoid";
import { useUIStore } from "../../../store/ui-store";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatAreaProps {
  initialMessages?: UIMessage[];
  chatId?: string | null;
}

// Message skeleton for loading state
function MessageSkeleton() {
  return (
    <div className="space-y-6 p-4">
      {/* User message skeleton */}
      <div className="flex w-full flex-row-reverse gap-2">
        <div className="flex w-full max-w-[70%] flex-row-reverse space-y-2">
          <Skeleton className="h-10 w-[40%] rounded-2xl" />
        </div>
      </div>
      <div className="flex w-full justify-start gap-2">
        <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
        <div className="w-full max-w-[80%] space-y-2">
          <Skeleton className="h-36 w-[70%] rounded-2xl" />
          <Skeleton className="h-8 w-[50%] rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function ChatArea({
  initialMessages = [],
  chatId: serverChatId,
}: ChatAreaProps) {
  const { mutate } = useSWRConfig();
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const { currentModelId } = useModelStore();
  const { createdChatIds, markAsCreated, resetKey } = useChatStatusStore();
  const { isNavigating, navigatingToChatId, setNavigating } = useUIStore();

  const stableId = useMemo(
    () => (resetKey ? serverChatId || nanoid(10) : serverChatId || nanoid(10)),
    [serverChatId, resetKey],
  );

  // Derive loading state from navigation state
  const isInitialLoading = useMemo(() => {
    return (
      isNavigating &&
      navigatingToChatId !== null &&
      navigatingToChatId !== serverChatId
    );
  }, [isNavigating, navigatingToChatId, serverChatId]);

  // Reset refs when chatId changes
  useEffect(() => {
    shouldAutoScrollRef.current = true;
    if (
      navigatingToChatId === serverChatId ||
      (!serverChatId && navigatingToChatId === null)
    ) {
      setNavigating(false);
    }
  }, [stableId, serverChatId, navigatingToChatId, setNavigating]);

  const {
    messages,
    status,
    sendMessage,
    error,
    stop,
    regenerate,
    setMessages,
  } = useChat({
    id: stableId,
    messages: initialMessages,
    experimental_throttle: 50,
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    onFinish: async ({ messages }) => {
      await saveChatMessages(stableId, messages);
    },
  });

  const handleRetry = useCallback(
    (messageId: string) => {
      regenerate({
        messageId,
        body: { modelId: currentModelId },
      });
    },
    [regenerate, currentModelId],
  );

  const handleDelete = useCallback(
    (messageId: string) => {
      const index = messages.findIndex((m) => m.id === messageId);
      if (index === -1) return;

      const targetMessage = messages[index];
      const newMessages = [...messages];

      if (
        targetMessage.role === "user" &&
        newMessages[index + 1]?.role === "assistant"
      ) {
        newMessages.splice(index, 2);
      } else {
        newMessages.splice(index, 1);
      }

      setMessages(newMessages);
      if (stableId) {
        saveChatMessages(stableId, newMessages);
      }
    },
    [messages, setMessages, stableId],
  );

  const generateTitle = async (text: string, targetChatId: string) => {
    try {
      const res = await fetch("/api/chat/title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.title) {
          await updateChatTitle(targetChatId, data.title);
          mutate("chat-list");
        }
      }
    } catch (e) {
      console.error("Failed to generate title", e);
    }
  };

  // Simple scroll to bottom
  const scrollToBottom = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, []);

  // Check if user is near bottom
  const checkIsAtBottom = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return true;
    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight <= 50;
  }, []);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    const isAtBottom = checkIsAtBottom();
    setShowScrollButton(!isAtBottom);
    shouldAutoScrollRef.current = isAtBottom;
  }, [checkIsAtBottom]);

  // Handle wheel events - disable auto scroll when user scrolls up
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY < 0) {
      shouldAutoScrollRef.current = false;
    }
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      scrollToBottom();
    }
  }, [messages, status, scrollToBottom]);

  const handleSendMessage = async (inputValue: string, attachments: File[]) => {
    // Ensure model is selected
    if (!currentModelId) {
      return;
    }

    shouldAutoScrollRef.current = true;
    setShowScrollButton(false);

    const fileUIParts = await Promise.all(attachments.map(convertFileToUIPart));

    // Get current capabilities state
    const capabilities = useChatCapabilitiesStore.getState().getCapabilities();

    sendMessage(
      {
        text: inputValue,
        files: fileUIParts,
      },
      {
        body: {
          modelId: currentModelId,
          capabilities,
        },
      },
    );

    if (!serverChatId && !createdChatIds[stableId]) {
      markAsCreated(stableId);
      console.log("Creating new chat");
      window.history.replaceState(null, "", `/chat/${stableId}`);
      await createChat(currentModelId, stableId);
      mutate("chat-list");
      generateTitle(inputValue, stableId);
    }
  };

  // Handle scroll to bottom button click
  const handleScrollToBottomClick = useCallback(() => {
    shouldAutoScrollRef.current = true;
    scrollToBottom();
    setShowScrollButton(false);
  }, [scrollToBottom]);

  // Show loading skeleton when navigating to another chat
  if (isInitialLoading) {
    return (
      <div className="relative mx-auto flex h-full w-full max-w-5xl flex-1 flex-col overflow-hidden p-2 pt-4">
        <div className="min-h-0 flex-1 overflow-hidden">
          <MessageSkeleton />
        </div>
        <InputBox
          onSubmit={handleSendMessage}
          status={status}
          stop={stop}
          currentChatId={stableId}
          disabled
        />
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-full w-full max-w-5xl flex-1 flex-col overflow-hidden p-2 pt-4">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onWheel={handleWheel}
        className="scrollbar-hide min-h-0 flex-1 overflow-y-auto"
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState />
          </div>
        ) : (
          <div className="min-h-8 space-y-6 pb-4">
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                onRetry={handleRetry}
                onDelete={handleDelete}
                isLoading={status === "streaming"}
                isLatest={index === messages.length - 1}
              />
            ))}
            {["submitted", "streaming"].includes(status) && (
              <div className="pl-12">
                <StreamingDots />
              </div>
            )}
            <div className="h-4" />
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>
            <p>{error.message || "未知错误"}</p>
            <Button
              size={"sm"}
              variant="outline"
              onClick={() => regenerate({ body: { modelId: currentModelId } })}
            >
              重试
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {showScrollButton && (
        <div className="absolute right-0 left-0" style={{ bottom: "180px" }}>
          <div className="mx-auto max-w-4xl text-center">
            <Button
              onClick={handleScrollToBottomClick}
              aria-label="Scroll to bottom"
              variant="outline"
              className="rounded-full shadow-md"
            >
              <ArrowDown />
              {status === "streaming" ? "生成中" : ""}
            </Button>
          </div>
        </div>
      )}

      <InputBox
        onSubmit={handleSendMessage}
        status={status}
        stop={stop}
        currentChatId={stableId}
      />
    </div>
  );
}

export function StreamingDots() {
  return (
    <div
      className={"text-muted-foreground inline-flex items-center gap-2 text-sm"}
    >
      <div className="flex gap-1">
        {[...Array(3)].map((_, i) => (
          <span
            key={i}
            className="size-1.5 animate-[fade_1.4s_ease-in-out_infinite] rounded-full bg-current"
            style={{
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
      <style jsx>{`
        @keyframes fade {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
