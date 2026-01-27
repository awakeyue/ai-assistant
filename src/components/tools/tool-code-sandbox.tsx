"use client";

import { memo, useMemo, useState, useCallback, useRef, useEffect } from "react";
import { ToolUIPart } from "ai";
import {
  SandpackProvider,
  SandpackCodeEditor,
  SandpackPreview,
  useSandpack,
} from "@codesandbox/sandpack-react";
import {
  Copy,
  Check,
  Play,
  Maximize2,
  Minimize2,
  Code2,
  Eye,
  RotateCcw,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Tool output type from server
 */
interface CodeSandboxOutput {
  code: string;
  title: string;
  template: "react" | "react-ts" | "vanilla" | "vanilla-ts" | "vue" | "vue-ts";
  dependencies?: Record<string, string>;
}

type TabType = "preview" | "code";

/**
 * Sandpack Preview content component
 */
const SandpackPreviewContent = memo(
  ({ isFullscreen }: { isFullscreen: boolean }) => {
    const editorHeight = isFullscreen ? "calc(100vh - 60px)" : "60vh";

    return (
      <SandpackPreview
        showOpenInCodeSandbox={false}
        showRefreshButton={false}
        style={{
          height: editorHeight,
          minHeight: editorHeight,
        }}
      />
    );
  },
);

SandpackPreviewContent.displayName = "SandpackPreviewContent";

/**
 * Sandpack Code Editor content component
 */
const SandpackCodeContent = memo(
  ({ isFullscreen }: { isFullscreen: boolean }) => {
    const editorHeight = isFullscreen ? "calc(100vh - 60px)" : "50vh";

    return (
      <SandpackCodeEditor
        showTabs={false}
        showLineNumbers
        showInlineErrors
        wrapContent
        style={{
          height: editorHeight,
          minHeight: editorHeight,
        }}
      />
    );
  },
);

SandpackCodeContent.displayName = "SandpackCodeContent";

/**
 * Refresh button that uses Sandpack context
 */
const RefreshButton = memo(() => {
  const { sandpack } = useSandpack();

  return (
    <button
      onClick={() => sandpack.runSandpack()}
      className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
      title="刷新预览"
    >
      <RotateCcw size={16} />
    </button>
  );
});

RefreshButton.displayName = "RefreshButton";

/**
 * Sandpack code renderer component
 */
const SandpackRenderer = memo(
  ({
    code,
    template,
    dependencies,
    onCopy,
    copied,
  }: {
    code: string;
    template: CodeSandboxOutput["template"];
    dependencies?: Record<string, string>;
    onCopy: () => void;
    copied: boolean;
  }) => {
    const [activeTab, setActiveTab] = useState<TabType>("preview");
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Listen for fullscreen change events
    useEffect(() => {
      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
      };

      document.addEventListener("fullscreenchange", handleFullscreenChange);
      return () => {
        document.removeEventListener(
          "fullscreenchange",
          handleFullscreenChange,
        );
      };
    }, []);

    // Toggle fullscreen mode
    const toggleFullscreen = useCallback(async () => {
      if (!containerRef.current) return;

      try {
        if (!document.fullscreenElement) {
          await containerRef.current.requestFullscreen();
        } else {
          await document.exitFullscreen();
        }
      } catch (err) {
        console.error("Fullscreen error:", err);
      }
    }, []);

    // Determine file name based on template
    const fileName = useMemo(() => {
      switch (template) {
        case "react-ts":
          return "/App.tsx";
        case "react":
          return "/App.js";
        case "vue":
        case "vue-ts":
          return "/src/App.vue";
        case "vanilla-ts":
          return "/index.ts";
        default:
          return "/index.js";
      }
    }, [template]);

    // Build files object
    const files = useMemo(() => {
      return {
        [fileName]: {
          code: code,
          active: true,
        },
      };
    }, [code, fileName]);

    // Custom dependencies with defaults
    const customSetup = useMemo(() => {
      if (!dependencies || Object.keys(dependencies).length === 0) {
        return undefined;
      }
      return {
        dependencies,
      };
    }, [dependencies]);

    return (
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-900 transition-all duration-300 dark:border-gray-700"
      >
        <SandpackProvider
          template={template}
          files={files}
          customSetup={customSetup}
          theme="dark"
          options={{
            externalResources: ["https://cdn.tailwindcss.com"],
          }}
        >
          <Tabs
            defaultValue="preview"
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as TabType)}
            className="w-full"
          >
            {/* Tab Header */}
            <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 px-3 py-1.5">
              <TabsList className="h-9 bg-gray-700/50">
                <TabsTrigger
                  value="preview"
                  className="gap-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                >
                  <Eye size={14} />
                  <span>预览</span>
                </TabsTrigger>
                <TabsTrigger
                  value="code"
                  className="gap-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                >
                  <Code2 size={14} />
                  <span>代码</span>
                </TabsTrigger>
              </TabsList>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                {activeTab === "preview" && <RefreshButton />}
                <button
                  onClick={onCopy}
                  className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-gray-200"
                  title="复制代码"
                >
                  {copied ? (
                    <Check size={16} className="text-green-500" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-gray-200"
                  title={isFullscreen ? "退出全屏" : "全屏"}
                >
                  {isFullscreen ? (
                    <Minimize2 size={16} />
                  ) : (
                    <Maximize2 size={16} />
                  )}
                </button>
              </div>
            </div>

            {/* Content Area */}
            <TabsContent value="preview" className="mt-0">
              <SandpackPreviewContent isFullscreen={isFullscreen} />
            </TabsContent>
            <TabsContent value="code" className="mt-0">
              <SandpackCodeContent isFullscreen={isFullscreen} />
            </TabsContent>
          </Tabs>
        </SandpackProvider>
      </div>
    );
  },
);

SandpackRenderer.displayName = "SandpackRenderer";

/**
 * Tool component for code sandbox preview
 * Renders code in an interactive sandbox using Sandpack
 */
export const ToolCodeSandbox = memo(
  ({ toolPart }: { toolPart: ToolUIPart }) => {
    const { state, title } = toolPart;
    const output = toolPart.output as CodeSandboxOutput | undefined;

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

    // Handle loading/streaming states
    if (state === "input-streaming" || state === "input-available") {
      return (
        <div className="block-fade-in my-2 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2 text-sm text-blue-600 dark:border-blue-900/30 dark:bg-blue-950/10 dark:text-blue-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span>正在生成代码 {title}...</span>
        </div>
      );
    }

    if (state === "output-available") {
      // Show skeleton if output is not available yet
      if (!output) {
        return (
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
        );
      }

      const { code, title: outputTitle, template, dependencies } = output;

      return (
        <div className="block-fade-in my-3 w-full">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-linear-to-br from-blue-50 to-cyan-50 shadow-sm dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200/50 bg-white/50 px-4 py-2 dark:border-gray-700/50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                <Play size={16} className="text-blue-500" />
                <span>{outputTitle}</span>
                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  {template}
                </span>
              </div>
            </div>

            {/* Sandpack Content */}
            <div className="relative">
              <SandpackRenderer
                code={code}
                template={template}
                dependencies={dependencies}
                onCopy={() => handleCopy(code)}
                copied={copied}
              />
            </div>
          </div>
        </div>
      );
    }

    if (state === "output-error") {
      return (
        <div className="block-fade-in my-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-950/10">
          <div className="text-sm text-red-600 dark:text-red-400">
            代码生成失败: {title}
          </div>
        </div>
      );
    }

    return null;
  },
);

ToolCodeSandbox.displayName = "ToolCodeSandbox";
