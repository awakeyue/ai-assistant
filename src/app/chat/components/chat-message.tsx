/* eslint-disable @next/next/no-img-element */
"use client";

import { UIMessage } from "@ai-sdk/react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { memo, useState } from "react";
import { FileUIPart, TextUIPart } from "ai";
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
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AgentLogo } from "./agent-logo";
import { CollapsibleText } from "@/components/custom/collapsible-text";

interface ChatMessageProps {
  message: UIMessage;
  // 新增 Props
  onRetry?: (id: string) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
  isLatest?: boolean;
}

const ChatMessage = memo(
  ({ message, onRetry, onDelete, isLoading, isLatest }: ChatMessageProps) => {
    const isUser = message.role === "user";

    // 提取纯文本内容用于复制
    const textContent = message.parts
      .filter((part) => part.type === "text")
      .map((part) => (part as TextUIPart).text)
      .join("");

    // 复制功能
    const [isCopied, setIsCopied] = useState(false);
    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(textContent);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    };

    const messageContent = (
      <div className="flex flex-col gap-3">
        {message.parts.map((part, idx) => {
          switch (part.type) {
            case "text":
              return <TextBlock key={idx} textPart={part} isUser={isUser} />;
            case "reasoning":
              return <ReasoningBlock key={idx} text={part.text} />;
            case "file":
              return <FileBlock key={idx} filePart={part} />;
            default:
              return null;
          }
        })}
      </div>
    );

    return (
      <div
        className={cn(
          "mb-6 flex w-full gap-2",
          isUser ? "flex-row-reverse" : "justify-start",
        )}
      >
        {!isUser && (
          <div>
            <AgentLogo animating={isLoading && isLatest} />
          </div>
        )}
        <div
          className={cn(
            "relative max-w-[85%] px-3 py-2 text-sm shadow-sm transition-all md:max-w-3xl lg:max-w-4xl",
            isUser
              ? "bg-primary text-primary-foreground group rounded-2xl rounded-tr-sm"
              : "rounded-2xl rounded-tl-sm border border-gray-100 bg-white text-gray-800 md:min-w-xl lg:min-w-3xl dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100",
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
                      onClick={() => onRetry(message.id)}
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
                      onClick={() => onDelete(message.id)}
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
function ReasoningBlock({ text }: { text: string }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!text) return null;

  return (
    <div className="my-2 rounded-lg border border-amber-100 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 rounded-t-lg px-3 py-2 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-100/50"
      >
        <BrainCircuit size={14} className="animate-pulse" />
        <span>思考过程</span>
        <span className="ml-auto text-amber-400">
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>

      {isOpen && (
        <div className="animate-in fade-in slide-in-from-top-1 border-t border-amber-100 px-3 py-2 duration-200">
          <div className="prose prose-sm max-w-none font-mono text-xs leading-relaxed text-gray-600 dark:text-gray-300">
            {text}
          </div>
        </div>
      )}
    </div>
  );
}

// --- 2. 文件展示组件 (File Block) ---
const FileBlock = memo(({ filePart }: { filePart: FileUIPart }) => {
  const { filename, mediaType, url } = filePart;
  const isImage = mediaType?.startsWith("image/");

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
      <div className="group relative mt-2 mb-4 overflow-hidden rounded-lg border bg-gray-50 shadow-sm transition-all hover:shadow-md">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <img
                src={url}
                alt={filename || "Uploaded image"}
                className="mx-auto max-h-80 w-auto max-w-full object-contain"
                loading="lazy"
              />
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
      className="group flex w-fit items-center gap-3 rounded-lg border bg-white p-3 pr-6 text-sm shadow-sm transition-all hover:border-blue-200 hover:bg-gray-50 hover:shadow-md"
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

// --- 3. 核心文本渲染组件 (Text Block with Markdown) ---
const TextBlock = memo(
  ({ textPart, isUser }: { textPart: TextUIPart; isUser: boolean }) => {
    // 如果是用户，直接显示纯文本，不解析 Markdown (防止 XSS 或者用户输入的格式乱掉，也可选择开启)
    if (isUser) {
      return (
        <div className="leading-relaxed whitespace-pre-wrap">
          {textPart.text}
        </div>
      );
    }

    return (
      <div className="markdown-body leading-6">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={MarkdownComponents}
        >
          {textPart.text}
        </ReactMarkdown>
      </div>
    );
  },
);
TextBlock.displayName = "TextBlock";

// --- 4. Markdown 组件定义 (样式核心) ---

const MarkdownComponents: Components = {
  // 代码块处理 (支持高亮 + 复制)
  code({ inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || "");
    const isInline = inline || !match;
    const codeString = String(children).replace(/\n$/, "");

    if (isInline) {
      return (
        <code
          className="rounded bg-gray-200 px-1.5 py-0.5 font-mono text-sm text-red-500 dark:bg-gray-800 dark:text-red-400"
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <CodeBlock
        language={match ? match[1] : "text"}
        value={codeString}
        {...props}
      />
    );
  },

  // 表格处理
  table: ({ children }) => (
    // 外层容器：只在表格宽度真的超过屏幕时才显示滚动条
    <div className="scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent my-4 w-full overflow-x-auto overflow-y-hidden rounded-lg border border-gray-200">
      {/* min-w-full 确保表格至少占满容器宽度 */}
      <table className="w-full min-w-full table-auto border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  ),

  thead: ({ children }) => (
    <thead className="bg-gray-50 text-gray-700">{children}</thead>
  ),

  tbody: ({ children }) => (
    <tbody className="divide-y divide-gray-200 bg-white">{children}</tbody>
  ),

  tr: ({ children }) => (
    <tr className="transition-colors hover:bg-gray-50/50">{children}</tr>
  ),

  th: ({ children }) => (
    <th className="border-b border-gray-200 px-4 py-3 text-left align-middle font-semibold wrap-break-word text-gray-900">
      {children}
    </th>
  ),

  td: ({ children }) => (
    <td className="px-4 py-3 align-top leading-relaxed wrap-break-word text-gray-600">
      {children}
    </td>
  ),
  // 基础排版
  p: ({ children }) => <p className="mb-4 leading-7 last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="mb-4 list-disc space-y-1 pl-6">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-4 list-decimal space-y-1 pl-6">{children}</ol>
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

// --- 5. 代码块逻辑组件 (含复制功能) ---
const CodeBlock = memo(
  ({ language, value }: { language: string; value: string }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(value);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    };

    return (
      <div className="group relative my-4 overflow-hidden rounded-lg border border-gray-200 bg-[#1e1e1e] dark:border-gray-700">
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

        {/* 语法高亮区域 */}
        <div className="overflow-x-auto p-4 font-mono text-sm leading-relaxed">
          <pre>
            <code className="text-white/80">{value}</code>
          </pre>
        </div>
      </div>
    );
  },
);
CodeBlock.displayName = "CodeBlock";
