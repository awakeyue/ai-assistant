"use client";

import { UIMessage } from "@ai-sdk/react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { memo, useState, useCallback, useDeferredValue } from "react";
import { FileUIPart, ReasoningUIPart, TextUIPart } from "ai";
import {
  ToolGomokuGame,
  ToolCurrentTime,
  ToolCodeSandbox,
} from "@/components/tools";
import Image from "next/image";
import {
  FileSpreadsheet,
  FileText,
  Link as LinkIcon,
  Check,
  Copy,
  Terminal,
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  FileCode,
  RotateCw, // 重试图标
  Trash2, // 删除图标
  Image as ImageIcon, // 图片占位图标
} from "lucide-react";
import { SyntaxHighlighter } from "@/components/custom/syntax-highlighter";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AgentLogo } from "./agent-logo";
import { CollapsibleText } from "@/components/custom/collapsible-text";
import { StreamingDots } from "@/components/custom/streaming-dots";

interface ChatMessageProps {
  message: UIMessage;
  chatId?: string; // Chat ID for sharing functionality
  // 新增 Props
  onRetry?: (id: string) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
  isLatest?: boolean;
  isStreaming?: boolean; // 是否正在流式输出
}

const ChatMessage = memo(
  ({
    message,
    chatId,
    onRetry,
    onDelete,
    isLoading,
    isLatest,
    isStreaming,
  }: ChatMessageProps) => {
    const isUser = message.role === "user";

    // 提取纯文本内容用于复制
    const textContent = message.parts
      .filter((part) => part.type === "text")
      .map((part) => (part as TextUIPart).text)
      .join("");

    // 复制功能
    const [isCopied, setIsCopied] = useState(false);
    const handleCopy = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(textContent);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }, [textContent]);

    const messageContent = (
      <div className="flex flex-col gap-0">
        {message.parts.map((part, idx) => {
          const key =
            "toolCallId" in part ? part.toolCallId : `${part.type}-${idx}`;
          switch (part.type) {
            case "text":
              return (
                <TextBlock
                  key={key}
                  textPart={part}
                  isUser={isUser}
                  isStreaming={isStreaming && isLatest}
                />
              );
            case "reasoning":
              return (
                <ReasoningBlock
                  key={key}
                  reasonPart={part}
                  isStreaming={!!isStreaming}
                />
              );
            case "file":
              return <FileBlock key={key} filePart={part} />;
            case "tool-gomokuGame":
              return <ToolGomokuGame key={key} toolPart={part} />;
            case "tool-currentTime":
              return <ToolCurrentTime key={key} toolPart={part} />;
            case "tool-codeSandbox":
              return (
                <ToolCodeSandbox
                  key={key}
                  toolPart={part}
                  isStreaming={!!isStreaming}
                  chatId={chatId}
                  messageId={message.id}
                />
              );
            default:
              return null;
          }
        })}
        {isStreaming && <StreamingDots className="pt-2" />}
      </div>
    );

    // Memoize retry and delete handlers
    const handleRetry = useCallback(() => {
      onRetry?.(message.id);
    }, [onRetry, message.id]);

    const handleDelete = useCallback(() => {
      onDelete?.(message.id);
    }, [onDelete, message.id]);

    return (
      <div
        className={cn(
          "flex w-full gap-2",
          isUser ? "flex-row-reverse" : "justify-start",
        )}
        style={{ contain: "layout style" }}
      >
        {!isUser && (
          <div className="hidden md:block">
            <AgentLogo animating={isLoading && isLatest} />
          </div>
        )}
        <div
          className={cn(
            "relative px-3 py-2 text-sm shadow-sm transition-all md:max-w-3xl lg:max-w-4xl",
            isUser
              ? "bg-primary text-primary-foreground group max-w-full rounded-2xl rounded-tr-sm"
              : "w-full rounded-2xl rounded-tl-sm border border-gray-100 bg-white text-gray-800 md:min-w-xl lg:min-w-3xl dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100",
          )}
        >
          {/* 内容区域 */}
          {isUser ? (
            <CollapsibleText>{messageContent}</CollapsibleText>
          ) : (
            messageContent
          )}

          {/* 底部操作栏 */}
          {!isLoading && (
            <div
              className={cn(
                "absolute -bottom-7 flex items-center gap-2 text-gray-500 opacity-100 transition-opacity dark:text-gray-300",
                isUser ? "right-0 opacity-0 group-hover:opacity-100" : "left-0",
              )}
            >
              {/* 复制按钮 (所有消息都有) */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 rounded p-1 text-xs transition-colors hover:bg-black/5"
                  >
                    {isCopied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>复制内容</TooltipContent>
              </Tooltip>

              {/* AI 消息特有：重试 */}
              {(!isUser || (isUser && isLatest)) && onRetry && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleRetry}
                      className="flex items-center gap-1 rounded p-1 text-xs transition-colors hover:bg-black/5"
                    >
                      <RotateCw size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>重新生成</TooltipContent>
                </Tooltip>
              )}

              {/* 用户消息特有：删除 */}
              {isUser && onDelete && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-1 rounded p-1 text-xs transition-colors hover:bg-black/5"
                    >
                      <Trash2 size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>删除</TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
);

ChatMessage.displayName = "ChatMessage";
export default ChatMessage;

// --- 1. 推理/思考块组件 (Reasoning Block) ---
const ReasoningBlock = memo(
  ({
    reasonPart,
    isStreaming,
  }: {
    reasonPart: ReasoningUIPart;
    isStreaming: boolean;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const text = reasonPart.text;

    if (!text) return null;

    const isReasoning = reasonPart.state === "streaming" && isStreaming;
    const showBrainIcon = !isOpen && !isHovered;
    const showChevronIcon = isHovered || isOpen;

    return (
      <div className="block-fade-in my-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="group flex w-full items-center gap-1 py-1 text-gray-400 transition-colors hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
        >
          {/* Icon container with smooth transition */}
          <span className="relative flex w-3.5 items-center justify-center">
            {/* Brain icon - visible when collapsed, not hovered, not streaming */}
            <BrainCircuit
              size={14}
              className={cn(
                "absolute text-gray-400 transition-all duration-200 dark:text-gray-500",
                showBrainIcon ? "scale-100 opacity-100" : "scale-75 opacity-0",
              )}
            />
            {/* Chevron icon - visible when hovered or expanded */}
            {isOpen ? (
              <ChevronDown
                size={16}
                className={cn(
                  "absolute text-gray-400 transition-all duration-200 dark:text-gray-500",
                  showChevronIcon
                    ? "scale-100 opacity-100"
                    : "scale-75 opacity-0",
                )}
              />
            ) : (
              <ChevronRight
                size={16}
                className={cn(
                  "absolute text-gray-400 transition-all duration-200 dark:text-gray-500",
                  showChevronIcon
                    ? "scale-100 opacity-100"
                    : "scale-75 opacity-0",
                )}
              />
            )}
          </span>
          {/* Text with loading animation */}
          <span
            className={cn(
              isReasoning && "shimmer text-zinc-500 dark:text-gray-400",
            )}
          >
            {isReasoning ? "深度思考中..." : "思考过程"}
          </span>
        </button>

        {isOpen && (
          <div className="animate-in fade-in slide-in-from-top-1 py-2 pl-1 duration-200">
            <div className="prose prose-sm max-w-none border-l border-gray-200 pl-3 font-mono text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              <div
                className="markdown-body"
                style={{
                  contain: "content",
                  contentVisibility: "auto",
                  containIntrinsicSize: "0 100px",
                  minHeight: "1.5em",
                }}
              >
                <ReactMarkdown
                  remarkPlugins={remarkPlugins}
                  components={markdownComponents}
                >
                  {text}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);
ReasoningBlock.displayName = "ReasoningBlock";

// --- 2. 文件展示组件 (File Block) ---
const FileBlock = memo(({ filePart }: { filePart: FileUIPart }) => {
  const { filename, mediaType, url } = filePart;
  const isImage = mediaType?.startsWith("image/");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const getIcon = () => {
    if (mediaType?.includes("pdf"))
      return <FileText className="text-red-500" size={18} />;
    if (mediaType?.includes("word") || filename?.endsWith(".doc"))
      return <FileText className="text-blue-500" size={18} />;
    if (mediaType?.includes("sheet") || filename?.endsWith(".xls"))
      return <FileSpreadsheet className="text-green-500" size={18} />;
    if (mediaType?.startsWith("text/"))
      return <FileCode className="text-gray-500" size={18} />;
    return <LinkIcon size={18} />;
  };

  if (isImage) {
    return (
      <div className="group block-fade-in relative mt-2 mb-4 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {/* Fixed size container for consistent image display */}
              <div className="relative flex h-48 w-48 items-center justify-center overflow-hidden sm:h-56 sm:w-56">
                {/* Loading placeholder */}
                {!imageLoaded && !imageError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <ImageIcon size={32} className="animate-pulse" />
                      <span className="text-xs">加载中...</span>
                    </div>
                  </div>
                )}
                {/* Error placeholder */}
                {imageError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <ImageIcon size={32} />
                      <span className="text-xs">图片加载失败</span>
                    </div>
                  </div>
                )}
                <Image
                  src={url}
                  alt={filename || "Uploaded image"}
                  fill
                  className={cn(
                    "object-cover transition-opacity duration-300",
                    imageLoaded ? "opacity-100" : "opacity-0",
                  )}
                  loading="lazy"
                  unoptimized
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {filename}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block-fade-in flex w-fit items-center gap-3 rounded-lg border bg-white p-3 pr-6 text-sm shadow-sm transition-all hover:border-blue-200 hover:bg-gray-50 hover:shadow-md"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-colors group-hover:bg-white">
        {getIcon()}
      </div>
      <div className="flex flex-col overflow-hidden">
        <span className="truncate font-medium text-gray-700 group-hover:text-blue-600">
          {filename || "未知文件"}
        </span>
        <span className="text-xs text-gray-400">点击查看预览</span>
      </div>
    </a>
  );
});
FileBlock.displayName = "FileBlock";

// --- 4. 核心文本渲染组件 (Text Block with Markdown) ---
// Uses useDeferredValue to keep UI responsive during rapid streaming updates
const TextBlock = ({
  textPart,
  isUser,
  isStreaming,
}: {
  textPart: TextUIPart;
  isUser: boolean;
  isStreaming?: boolean;
}) => {
  // Use deferred value to reduce rendering priority during streaming
  // This allows React to skip intermediate renders and keep UI responsive
  const deferredText = useDeferredValue(textPart.text);

  // 如果是用户，直接显示纯文本，不解析 Markdown (防止 XSS 或者用户输入的格式乱掉，也可选择开启)
  if (isUser) {
    return (
      <div className="leading-relaxed whitespace-pre-wrap">{deferredText}</div>
    );
  }

  // Render Markdown for AI messages
  return <MarkdownRenderer text={deferredText} isStreaming={isStreaming} />;
};
TextBlock.displayName = "TextBlock";

// Animation styles are now in globals.css for better performance and caching

// Stable remarkPlugins array reference - defined at module level
const remarkPlugins = [remarkGfm];

// Stable MarkdownComponents reference - defined at module level to avoid recreation
const markdownComponents: Components = {
  // 代码块处理 (支持高亮 + 复制)
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    // Check if it's inline code (no language class means inline)
    const isInline = !match;
    const codeString = String(children).replace(/\n$/, "");

    if (isInline) {
      return (
        <code
          className="rounded bg-gray-200 px-1.5 py-0.5 font-mono text-sm text-red-500 dark:bg-gray-400/5 dark:text-red-400"
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <div>
        <CodeBlock language={match ? match[1] : "text"} value={codeString} />
      </div>
    );
  },

  // 表格处理
  table: ({ children }) => (
    <div className="scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent dark:scrollbar-thumb-gray-500 my-4 w-full overflow-x-auto overflow-y-hidden rounded-lg border border-gray-200 dark:border-gray-600">
      <table className="w-full min-w-full table-auto border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  ),

  thead: ({ children }) => (
    <thead className="bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
      {children}
    </thead>
  ),

  tbody: ({ children }) => (
    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-600 dark:bg-gray-700/50">
      {children}
    </tbody>
  ),

  tr: ({ children }) => (
    <tr className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
      {children}
    </tr>
  ),

  th: ({ children }) => (
    <th className="border-b border-gray-200 px-4 py-3 text-left align-middle font-semibold wrap-break-word text-gray-900 dark:border-gray-600 dark:text-gray-100">
      {children}
    </th>
  ),

  td: ({ children }) => (
    <td className="px-4 py-3 align-top leading-relaxed wrap-break-word text-gray-600 dark:text-gray-300">
      {children}
    </td>
  ),
  // 基础排版
  p: ({ children }) => <p className="mb-4 leading-7 last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="mb-4 list-disc space-y-2 pl-6">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-4 list-decimal space-y-2 pl-6">{children}</ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  h1: ({ children }) => (
    <h1 className="mt-6 mb-4 border-b pb-2 text-2xl font-bold tracking-tight text-gray-900">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-5 mb-3 text-xl font-semibold tracking-tight text-gray-800">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-4 mb-2 text-lg font-semibold text-gray-800">
      {children}
    </h3>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-4 border-gray-300 bg-gray-50 py-2 pl-4 text-gray-600 italic">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-blue-600 underline decoration-blue-300 underline-offset-4 transition-colors hover:text-blue-800 hover:decoration-blue-800"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-6 border-gray-200" />,
};

// Separate component for Markdown rendering
// Memoized to prevent unnecessary re-parses when text hasn't changed
const MarkdownRenderer = memo(
  ({ text, isStreaming }: { text: string; isStreaming?: boolean }) => {
    return (
      <div
        className={cn("markdown-body leading-6", isStreaming && "streaming")}
        style={{
          contain: "content",
          contentVisibility: "auto",
          containIntrinsicSize: "0 100px",
          minHeight: "1.5em",
        }}
      >
        <ReactMarkdown
          remarkPlugins={remarkPlugins}
          components={markdownComponents}
        >
          {text}
        </ReactMarkdown>
      </div>
    );
  },
);
MarkdownRenderer.displayName = "MarkdownRenderer";

// --- 4. 代码块逻辑组件 (含复制功能 + 懒加载语法高亮) ---
const CodeBlock = memo(
  ({ language, value }: { language: string; value: string }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(value);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }, [value]);

    return (
      <div
        className="group relative my-4 overflow-hidden rounded-lg border border-gray-200 bg-[#1e1e1e] dark:border-gray-700"
        style={{ contain: "layout style" }}
      >
        {/* 代码块头部：显示语言和复制按钮 */}
        <div className="flex items-center justify-between bg-[#2d2d2d] px-4 py-2 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Terminal size={14} />
            <span className="font-mono lowercase">{language}</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex cursor-pointer items-center gap-1 transition-colors hover:text-white"
            title="Copy code"
          >
            {isCopied ? (
              <>
                <Check size={14} className="text-green-500" />
                <span className="text-green-500">已复制</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>复制</span>
              </>
            )}
          </button>
        </div>

        {/* 语法高亮区域 - 使用懒加载的 SyntaxHighlighter */}
        <div
          className="overflow-x-auto p-4 font-mono text-sm leading-relaxed [&::-webkit-scrollbar]:h-4 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-track]:bg-transparent"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#4b5563 transparent",
          }}
        >
          <SyntaxHighlighter code={value} language={language} />
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.language === nextProps.language &&
      prevProps.value === nextProps.value
    );
  },
);
CodeBlock.displayName = "CodeBlock";
