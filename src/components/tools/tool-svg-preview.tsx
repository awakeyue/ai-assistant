"use client";

import { memo, useMemo, useState, useCallback } from "react";
import { ToolUIPart } from "ai";
import { Code, Eye, Copy, Check, Palette } from "lucide-react";

/**
 * Tool output type from server
 */
interface SvgPreviewOutput {
  code: string;
  title: string;
}

/**
 * Custom comparison function for memo
 * Only re-render when state or output actually changes
 * This prevents flickering when parent component re-renders during streaming
 */
function areToolPartsEqual(
  prevProps: { toolPart: ToolUIPart },
  nextProps: { toolPart: ToolUIPart },
): boolean {
  const prev = prevProps.toolPart;
  const next = nextProps.toolPart;

  // If state changed, re-render
  if (prev.state !== next.state) {
    return false;
  }

  // For output-available state, compare output content
  if (prev.state === "output-available" && next.state === "output-available") {
    const prevOutput = prev.output as SvgPreviewOutput | undefined;
    const nextOutput = next.output as SvgPreviewOutput | undefined;

    // If both are undefined, they're equal
    if (!prevOutput && !nextOutput) {
      return true;
    }

    // If one is undefined and the other isn't, they're not equal
    if (!prevOutput || !nextOutput) {
      return false;
    }

    // Compare actual content
    return (
      prevOutput.code === nextOutput.code &&
      prevOutput.title === nextOutput.title
    );
  }

  // For other states, state equality is enough
  return true;
}

/**
 * Safely render SVG code
 */
function SvgRenderer({ code }: { code: string }) {
  // Sanitize SVG code - basic XSS prevention
  const sanitizedSvg = useMemo(() => {
    // Remove potentially dangerous attributes and elements
    const safe = code
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/on\w+\s*=/gi, "data-removed=")
      .replace(/javascript:/gi, "");
    return safe;
  }, [code]);

  return (
    <div
      className="flex items-center justify-center [&>svg]:max-h-64 [&>svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
    />
  );
}

/**
 * Tool component for SVG preview
 * Renders SVG code in the chat
 */
export const ToolSvgPreview = memo(({ toolPart }: { toolPart: ToolUIPart }) => {
  const { state, title } = toolPart;
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  // Handle copy to clipboard
  const handleCopy = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy code");
    }
  }, []);

  // Handle loading state
  if (state === "input-available") {
    return (
      <div className="block-fade-in my-2 flex items-center gap-2 rounded-lg border border-purple-100 bg-purple-50/50 px-3 py-2 text-sm text-purple-600 dark:border-purple-900/30 dark:bg-purple-950/10 dark:text-purple-400">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        <span>正在生成 {title}...</span>
      </div>
    );
  }

  if (state === "output-available") {
    const output = toolPart.output as SvgPreviewOutput | undefined;

    // Show skeleton if output is not available yet
    if (!output) {
      return (
        <div className="block-fade-in my-3 w-full max-w-md">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-linear-to-br from-purple-50 to-pink-50 shadow-sm dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
            <div className="border-b border-gray-200/50 bg-white/50 px-4 py-2 dark:border-gray-700/50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                <Palette size={16} className="text-purple-500" />
                <span>生成中...</span>
              </div>
            </div>
            <div className="flex h-48 items-center justify-center">
              <div className="h-24 w-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        </div>
      );
    }

    const { code, title: outputTitle } = output;

    return (
      <div className="block-fade-in my-3 w-full max-w-md">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-linear-to-br from-purple-50 to-pink-50 shadow-sm dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200/50 bg-white/50 px-4 py-2 dark:border-gray-700/50 dark:bg-gray-800/50">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
              <Palette size={16} className="text-purple-500" />
              <span>{outputTitle}</span>
              <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                SVG
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowCode(!showCode)}
                className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                title={showCode ? "显示预览" : "显示代码"}
              >
                {showCode ? <Eye size={16} /> : <Code size={16} />}
              </button>
              <button
                onClick={() => handleCopy(code)}
                className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                title="复制代码"
              >
                {copied ? (
                  <Check size={16} className="text-green-500" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="min-h-32">
            {showCode ? (
              <div className="max-h-64 overflow-auto bg-gray-900 p-4">
                <pre className="text-xs text-gray-100">
                  <code>{code}</code>
                </pre>
              </div>
            ) : (
              <div className="flex items-center justify-center bg-white/80 p-4 dark:bg-gray-800/80">
                <SvgRenderer code={code} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (state === "output-error") {
    return (
      <div className="block-fade-in my-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-950/10">
        <div className="text-sm text-red-600 dark:text-red-400">
          生成失败: {title}
        </div>
      </div>
    );
  }

  return null;
}, areToolPartsEqual);

ToolSvgPreview.displayName = "ToolSvgPreview";
