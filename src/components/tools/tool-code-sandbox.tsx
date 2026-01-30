"use client";

import { memo, useState } from "react";
import { ToolUIPart } from "ai";
import {
  Play,
  BadgeAlert,
  ChevronDown,
  ChevronRight,
  Share2,
} from "lucide-react";
import { CodeSkeletonLoader } from "../custom/code-loading";
import { cn } from "@/lib/utils";
import { SandboxPreview, CodeSandboxOutput } from "./sandbox-preview";

// =============================================================================
// Loading & Error States
// =============================================================================

const LoadingState = memo(({ title }: { title?: string }) => (
  <div className="block-fade-in my-2 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2 text-sm text-blue-600 dark:border-blue-900/30 dark:bg-blue-950/10 dark:text-blue-400">
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
    <span>正在生成代码{title ? ` ${title}` : ""}...</span>
  </div>
));

LoadingState.displayName = "LoadingState";

const ErrorState = memo(({ error }: { title?: string; error?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const showAlertIcon = !isOpen && !isHovered;
  const showChevronIcon = isHovered || isOpen;

  return (
    <div className="block-fade-in my-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group flex w-full items-center gap-1 py-1 text-red-400 transition-colors hover:text-red-500 dark:text-red-400 dark:hover:text-red-300"
      >
        {/* Icon container with smooth transition */}
        <span className="relative flex h-4 w-4 items-center justify-center">
          {/* Alert icon - visible when collapsed and not hovered */}
          <BadgeAlert
            size={16}
            className={cn(
              "absolute transition-all duration-200",
              showAlertIcon ? "scale-100 opacity-100" : "scale-75 opacity-0",
            )}
          />
          {/* Chevron icon - visible when hovered or expanded */}
          {isOpen ? (
            <ChevronDown
              size={16}
              className={cn(
                "absolute transition-all duration-200",
                showChevronIcon
                  ? "scale-100 opacity-100"
                  : "scale-75 opacity-0",
              )}
            />
          ) : (
            <ChevronRight
              size={16}
              className={cn(
                "absolute transition-all duration-200",
                showChevronIcon
                  ? "scale-100 opacity-100"
                  : "scale-75 opacity-0",
              )}
            />
          )}
        </span>
        <span className="text-sm">代码生成失败</span>
      </button>

      {isOpen && error && (
        <div className="animate-in fade-in slide-in-from-top-1 py-2 pl-1 duration-200">
          <p className="border-l-2 border-red-400/20 pl-3 text-xs leading-relaxed text-red-500 dark:border-red-500/50 dark:text-red-400/80">
            {error}
          </p>
        </div>
      )}
    </div>
  );
});

ErrorState.displayName = "ErrorState";

const SkeletonState = memo(() => (
  <div className="block-fade-in my-3 w-full">
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-linear-to-br from-blue-50 to-cyan-50 shadow-sm dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
      <div className="border-b border-gray-200/50 bg-white/50 px-4 py-2 dark:border-gray-700/50 dark:bg-gray-800/50">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
          <Play size={16} className="text-blue-500" />
          <span>生成中...</span>
        </div>
      </div>
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-32 w-full max-w-md animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  </div>
));

SkeletonState.displayName = "SkeletonState";

// =============================================================================
// Output Content Component with Share Button
// =============================================================================

interface OutputContentProps {
  output: CodeSandboxOutput;
  chatId?: string;
  messageId?: string;
}

const OutputContent = memo(
  ({ output, chatId, messageId }: OutputContentProps) => {
    const { title: outputTitle, template } = output;

    // Count only visible files (not hidden)
    const visibleFileCount = Object.values(output.files).filter(
      (file) => !file.hidden,
    ).length;

    // Handle share button click
    const handleShare = () => {
      if (!chatId || !messageId) {
        console.warn("Cannot share: missing chatId or messageId");
        return;
      }
      // Open share page in new tab
      const shareUrl = `/share/sandbox/${chatId}/${messageId}`;
      window.open(shareUrl, "_blank");
    };

    const canShare = !!chatId && !!messageId;

    return (
      <div className="block-fade-in my-3 w-full">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-linear-to-br from-blue-50 to-cyan-50 shadow-sm dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
          {/* Header with Share Button */}
          <div className="flex items-center justify-between border-b border-gray-200/50 bg-white/50 px-4 py-2 dark:border-gray-700/50 dark:bg-gray-800/50">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
              <Play size={16} className="text-blue-500" />
              <span>{outputTitle}</span>
              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                {template}
              </span>
              {visibleFileCount > 1 && (
                <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  {visibleFileCount} files
                </span>
              )}
            </div>
            {canShare && (
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                title="通过url分享代码"
              >
                <Share2 size={14} />

                <span>分享</span>
              </button>
            )}
          </div>

          {/* Sandpack Content */}
          <SandboxPreview output={output} showHeader={false} />
        </div>
      </div>
    );
  },
);

OutputContent.displayName = "OutputContent";

// =============================================================================
// Main Export Component
// =============================================================================

/**
 * Tool component for code sandbox preview
 * Renders code in an interactive sandbox using Sandpack
 */
export const ToolCodeSandbox = memo(
  ({
    toolPart,
    isStreaming,
    chatId,
    messageId,
  }: {
    toolPart: ToolUIPart;
    isStreaming: boolean;
    chatId?: string;
    messageId?: string;
  }) => {
    const { state, title } = toolPart;
    const rawOutput = toolPart.output;

    // Handle loading/streaming states
    if (state === "input-streaming" || state === "input-available") {
      return (
        <>
          {isStreaming && (
            <CodeSkeletonLoader
              title={
                state === "input-streaming"
                  ? "正在接收代码..."
                  : "准备执行中..."
              }
            />
          )}
        </>
      );
    }

    // Handle error state
    if (state === "output-error") {
      return <ErrorState title={title} error={toolPart.errorText} />;
    }

    // Handle output available state
    if (state === "output-available") {
      // Parse output - it might be a string that needs JSON parsing
      let output: CodeSandboxOutput | undefined;

      if (typeof rawOutput === "string") {
        try {
          output = JSON.parse(rawOutput) as CodeSandboxOutput;
        } catch {
          console.error("[ToolCodeSandbox] Failed to parse output:", rawOutput);
          return <ErrorState title={title} error="输出解析失败" />;
        }
      } else {
        output = rawOutput as CodeSandboxOutput | undefined;
      }

      if (!output || !output.files) {
        console.warn("[ToolCodeSandbox] Missing output or files:", output);
        return <SkeletonState />;
      }

      return (
        <OutputContent output={output} chatId={chatId} messageId={messageId} />
      );
    }

    return null;
  },
);

ToolCodeSandbox.displayName = "ToolCodeSandbox";
