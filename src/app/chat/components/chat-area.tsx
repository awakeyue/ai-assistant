"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { VList, type VListHandle } from "virtua";
import ChatMessage from "./chat-message";
import EmptyState from "./empty-state";
import InputBox from "./input-box";
import { QuickPrompts } from "./quick-prompts";
import { useModelStore, useChatStatusStore } from "@/store/chat";
import { useChatCapabilitiesStore } from "@/store/chat-capabilities";
import { DefaultChatTransport } from "ai";
import { AlertCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollToBottomButton } from "@/components/custom/scroll-to-bottom-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { saveChatMessages, createChat, updateChatTitle } from "@/actions/chat";
import { useSWRConfig } from "swr";
import type { UIMessage, FileUIPart, ToolUIPart } from "ai";
import { nanoid } from "nanoid";
import { useToolStateStore } from "@/store/tool-state-store";
import { useUIStore } from "@/store/ui-store";
import { Skeleton } from "@/components/ui/skeleton";
import { StreamingDots } from "@/components/custom/streaming-dots";

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
  const scrollRef = useRef<VListHandle>(null);
  const isAtBottomRef = useRef(true);
  const shouldAutoScrollRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  // Track touch start position for mobile scroll detection
  const touchStartYRef = useRef<number | null>(null);

  const { currentModelId } = useModelStore();
  const { createdChatIds, markAsCreated, resetKey } = useChatStatusStore();
  const { isNavigating, navigatingToChatId, setNavigating, isMobile } =
    useUIStore();

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

  // Get tool state store setter
  const setOnToolStateChange = useToolStateStore(
    (state) => state.setOnToolStateChange,
  );

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
    experimental_throttle: 80, // Increased from 50ms to reduce re-renders during streaming
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

  // Handle tool state changes - update the tool output in messages
  // This is a generic handler that works for any tool that needs state persistence
  const handleToolStateChange = useCallback(
    (toolCallId: string, toolState: Record<string, unknown>) => {
      const updatedMessages = messages.map((msg) => {
        if (msg.role !== "assistant") return msg;

        const updatedParts = msg.parts.map((part) => {
          // Check if this is the target tool part by toolCallId
          if (
            part.type.startsWith("tool-") &&
            (part as ToolUIPart).toolCallId === toolCallId
          ) {
            const toolPart = part as ToolUIPart;
            return {
              ...toolPart,
              output: {
                ...(toolPart.output as Record<string, unknown>),
                ...toolState,
              },
            } as typeof part;
          }
          return part;
        });

        return { ...msg, parts: updatedParts };
      });

      setMessages(updatedMessages);

      // Persist the updated messages
      if (stableId) {
        saveChatMessages(stableId, updatedMessages);
      }
    },
    [setMessages, stableId, messages],
  );

  // Register the callback to zustand store
  useEffect(() => {
    setOnToolStateChange(handleToolStateChange);
    return () => {
      setOnToolStateChange(null);
    };
  }, [handleToolStateChange, setOnToolStateChange]);

  const generateTitle = async (
    text: string,
    targetChatId: string,
    modelId: string,
  ) => {
    try {
      const res = await fetch("/api/chat/title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, modelId }),
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

  // Simple scroll to bottom - with virtualizer
  const scrollToBottom = useCallback(() => {
    const hasStreamingDots = status === "submitted";
    const totalCount = messages.length + (hasStreamingDots ? 1 : 0);
    if (totalCount > 0) {
      scrollRef.current?.scrollToIndex(totalCount - 1, { align: "end" });
    }
  }, [messages.length, status]);

  // Handle scroll events - only update UI state (showScrollButton)
  // shouldAutoScrollRef is controlled exclusively by user intent (wheel/click)
  const handleScroll = useCallback((offset: number) => {
    const handle = scrollRef.current;
    if (!handle) return;

    const { scrollSize, viewportSize } = handle;
    const isAtBottom = scrollSize - offset - viewportSize <= 50;

    isAtBottomRef.current = isAtBottom;
    setShowScrollButton(!isAtBottom);
  }, []);

  // Handle wheel events (desktop) - user intent controls auto-scroll
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY < 0) {
      // User scrolls up -> disable auto-scroll
      shouldAutoScrollRef.current = false;
    } else if (e.deltaY > 0 && isAtBottomRef.current) {
      // User scrolls down and reaches bottom -> re-enable auto-scroll
      shouldAutoScrollRef.current = true;
    }
  }, []);

  // Handle touch events (mobile) - user intent controls auto-scroll
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      touchStartYRef.current = e.touches[0].clientY;
    },
    [],
  );

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartYRef.current === null) return;

    const touchCurrentY = e.touches[0].clientY;
    const deltaY = touchStartYRef.current - touchCurrentY;

    if (deltaY < -10) {
      // User swipes down (scroll up) -> disable auto-scroll
      shouldAutoScrollRef.current = false;
    } else if (deltaY > 10 && isAtBottomRef.current) {
      // User swipes up (scroll down) and reaches bottom -> re-enable auto-scroll
      shouldAutoScrollRef.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    touchStartYRef.current = null;
  }, []);

  // Auto-scroll effect - simplified with virtualizer
  useEffect(() => {
    if (!shouldAutoScrollRef.current || messages.length === 0) return;

    // Use RAF to ensure DOM is ready
    const rafId = requestAnimationFrame(() => {
      if (shouldAutoScrollRef.current) {
        scrollToBottom();
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [messages, status, scrollToBottom]);

  const handleSendMessage = async (
    inputValue: string,
    attachments: FileUIPart[],
  ) => {
    // Ensure model is selected
    if (!currentModelId) {
      return;
    }

    shouldAutoScrollRef.current = true;
    setShowScrollButton(false);

    // Get current capabilities state
    const capabilities = useChatCapabilitiesStore.getState().getCapabilities();

    sendMessage(
      {
        text: inputValue,
        files: attachments.length > 0 ? attachments : undefined,
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
      generateTitle(inputValue, stableId, currentModelId);
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
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <EmptyState>
            <QuickPrompts
              onSelect={(prompt) => handleSendMessage(prompt, [])}
            />
          </EmptyState>
        </div>
      ) : (
        <div
          className="min-h-0 w-full flex-1"
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <VList
            ref={scrollRef}
            onScroll={handleScroll}
            className="scrollbar-hide h-full w-full"
          >
            {messages.map((message, index) => (
              <div key={message.id} className="pt-4 pb-8">
                <ChatMessage
                  message={message}
                  onRetry={handleRetry}
                  onDelete={handleDelete}
                  isLoading={status === "streaming"}
                  isLatest={index === messages.length - 1}
                  isStreaming={
                    status === "streaming" &&
                    index === messages.length - 1 &&
                    message.role === "assistant"
                  }
                />
              </div>
            ))}

            {/* Streaming dots - shown when streaming with empty content */}
            {status === "submitted" && (
              <div key="streaming-dots" className="pt-4 pb-8">
                <div className={isMobile ? "pl-2" : "pl-12"}>
                  <StreamingDots />
                </div>
              </div>
            )}
          </VList>
        </div>
      )}

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

      <ScrollToBottomButton
        onClick={handleScrollToBottomClick}
        visible={showScrollButton}
        loading={status === "streaming"}
      />

      <InputBox
        onSubmit={handleSendMessage}
        status={status}
        stop={stop}
        currentChatId={stableId}
      />
    </div>
  );
}
