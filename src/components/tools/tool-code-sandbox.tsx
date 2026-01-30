"use client";

import { memo, useMemo, useState, useCallback, useRef, useEffect } from "react";
import { ToolUIPart } from "ai";
import {
  SandpackProvider,
  SandpackCodeEditor,
  SandpackPreview,
  useSandpack,
  SandpackPredefinedTemplate,
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
  BadgeAlert,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeSkeletonLoader } from "../custom/code-loading";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

/**
 * File configuration for Sandpack
 */
interface SandpackFileConfig {
  code: string;
  hidden?: boolean;
  active?: boolean;
  readOnly?: boolean;
}

/**
 * Supported template types
 */
type SupportedTemplate =
  | "static"
  | "react"
  | "react-ts"
  | "vanilla"
  | "vanilla-ts"
  | "vue"
  | "vue-ts";

/**
 * Tool output from AI
 */
interface CodeSandboxOutput {
  files: Record<string, SandpackFileConfig>;
  title: string;
  template: SupportedTemplate;
  dependencies?: Record<string, string>;
}

type TabType = "preview" | "code";

// =============================================================================
// Template Configuration
// =============================================================================

/**
 * Template configuration with entry points and boilerplate
 */
interface TemplateConfigBase {
  entryFile: string;
  sandpackTemplate: SandpackPredefinedTemplate;
  // Files to add if missing entry point
  boilerplate?: Record<string, string>;
}

/**
 * Extended config for React templates with dynamic index generation
 */
interface ReactTemplateConfig extends TemplateConfigBase {
  // Pattern to match App file (e.g., /App.tsx or /src/App.tsx)
  appPattern: RegExp;
  // Path for the index file to generate
  indexFile: string;
  // Function to generate index file content based on App file path
  generateIndex: (appPath: string) => string;
}

type TemplateConfig = TemplateConfigBase | ReactTemplateConfig;

const TEMPLATE_CONFIG: Record<SupportedTemplate, TemplateConfig> = {
  static: {
    entryFile: "/index.html",
    sandpackTemplate: "static",
    boilerplate: {
      "/index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="app"></div>
  <script src="index.js"></script>
</body>
</html>`,
      "/index.js": `// Your code here`,
    },
  },
  react: {
    entryFile: "/App.js",
    sandpackTemplate: "react",
    appPattern: /\/(?:src\/)?App\.jsx?$/,
    indexFile: "/index.js",
    generateIndex: (appPath: string) => {
      const importPath = appPath
        .replace(/\.(js|jsx)$/, "")
        .replace(/^\//, "./");
      return `import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "${importPath}";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);`;
    },
  },
  "react-ts": {
    entryFile: "/App.tsx",
    sandpackTemplate: "react-ts",
    appPattern: /\/(?:src\/)?App\.tsx?$/,
    indexFile: "/index.tsx",
    generateIndex: (appPath: string) => {
      const importPath = appPath
        .replace(/\.(ts|tsx)$/, "")
        .replace(/^\//, "./");
      return `import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "${importPath}";

const root = createRoot(document.getElementById("root")!);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);`;
    },
  },
  vue: {
    entryFile: "/src/App.vue",
    sandpackTemplate: "vue",
  },
  "vue-ts": {
    entryFile: "/src/App.vue",
    sandpackTemplate: "vue-ts",
  },
  vanilla: {
    entryFile: "/index.js",
    sandpackTemplate: "vanilla",
  },
  "vanilla-ts": {
    entryFile: "/index.ts",
    sandpackTemplate: "vanilla-ts",
  },
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Type guard to check if config is a React template config
 */
function isReactTemplateConfig(
  config: TemplateConfig,
): config is ReactTemplateConfig {
  return (
    "appPattern" in config && "generateIndex" in config && "indexFile" in config
  );
}

/**
 * Normalize file path to start with /
 */
function normalizeFilePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

/**
 * Process and validate files for Sandpack
 * - Ensures file paths start with /
 * - Adds missing entry files
 * - Sets active file if none specified
 */
function processFiles(
  files: Record<string, SandpackFileConfig>,
  template: SupportedTemplate,
): Record<string, SandpackFileConfig> {
  const config = TEMPLATE_CONFIG[template];
  const processedFiles: Record<string, SandpackFileConfig> = {};

  // Normalize all file paths
  let hasActiveFile = false;
  for (const [path, fileConfig] of Object.entries(files)) {
    const normalizedPath = normalizeFilePath(path);
    processedFiles[normalizedPath] = { ...fileConfig };
    if (fileConfig.active) {
      hasActiveFile = true;
    }
  }

  // For React templates, check if we need to generate index file
  if (template.startsWith("react") && isReactTemplateConfig(config)) {
    const { appPattern, generateIndex, indexFile } = config;

    // Find the App file path
    const appFilePath = Object.keys(processedFiles).find((path) =>
      appPattern.test(path),
    );

    // If we have an App file but no index file, generate one
    if (appFilePath && !processedFiles[indexFile]) {
      processedFiles[indexFile] = {
        code: generateIndex(appFilePath),
        hidden: true,
      };
    }
  } else {
    // For non-React templates, use the old logic
    // Check if entry file exists
    const hasEntryFile = Object.keys(processedFiles).some(
      (path) =>
        path === config.entryFile ||
        // Also check common variations
        (template === "static" && path.includes("index.html")) ||
        (template.startsWith("vue") && path.includes("App.vue")),
    );

    // If no entry file and we have boilerplate, add it
    if (!hasEntryFile && config.boilerplate) {
      for (const [path, code] of Object.entries(config.boilerplate)) {
        if (!processedFiles[path]) {
          processedFiles[path] = { code, hidden: true };
        }
      }
    }
  }

  // Set first file as active if none specified
  if (!hasActiveFile) {
    const firstKey = Object.keys(processedFiles)[0];
    if (firstKey) {
      processedFiles[firstKey] = { ...processedFiles[firstKey], active: true };
    }
  }

  return processedFiles;
}

// =============================================================================
// Sub-Components
// =============================================================================

/**
 * Refresh button using Sandpack context
 */
const RefreshButton = memo(() => {
  const { sandpack } = useSandpack();

  return (
    <button
      onClick={() => sandpack.runSandpack()}
      className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-gray-200"
      title="刷新预览"
    >
      <RotateCcw size={16} />
    </button>
  );
});

RefreshButton.displayName = "RefreshButton";

/**
 * Preview panel with adjustable height
 */
const PreviewPanel = memo(({ isFullscreen }: { isFullscreen: boolean }) => {
  const height = isFullscreen ? "calc(100vh - 60px)" : "60vh";

  return (
    <SandpackPreview
      showOpenInCodeSandbox={false}
      showRefreshButton={false}
      style={{ height, minHeight: height }}
    />
  );
});

PreviewPanel.displayName = "PreviewPanel";

/**
 * Code editor panel
 */
const CodeEditorPanel = memo(
  ({
    isFullscreen,
    showTabs,
  }: {
    isFullscreen: boolean;
    showTabs: boolean;
  }) => {
    const height = isFullscreen ? "calc(100vh - 60px)" : "60vh";

    return (
      <SandpackCodeEditor
        showTabs={showTabs}
        showLineNumbers
        showInlineErrors
        wrapContent
        style={{ height, minHeight: height }}
      />
    );
  },
);

CodeEditorPanel.displayName = "CodeEditorPanel";

/**
 * Action buttons in the header
 */
const ActionButtons = memo(
  ({
    activeTab,
    fileCount,
    copied,
    isFullscreen,
    onCopy,
    onToggleFullscreen,
  }: {
    activeTab: TabType;
    fileCount: number;
    copied: boolean;
    isFullscreen: boolean;
    onCopy: () => void;
    onToggleFullscreen: () => void;
  }) => (
    <div className="flex items-center gap-1">
      {fileCount > 1 && (
        <span className="rounded bg-gray-600 px-1.5 py-0.5 text-xs text-gray-300">
          {fileCount} files
        </span>
      )}
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
        onClick={onToggleFullscreen}
        className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-gray-200"
        title={isFullscreen ? "退出全屏" : "全屏"}
      >
        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>
    </div>
  ),
);

ActionButtons.displayName = "ActionButtons";

// =============================================================================
// Main Sandpack Renderer
// =============================================================================

interface SandpackRendererProps {
  files: Record<string, SandpackFileConfig>;
  template: SupportedTemplate;
  dependencies?: Record<string, string>;
  onCopy: () => void;
  copied: boolean;
}

const SandpackRenderer = memo(
  ({
    files,
    template,
    dependencies,
    onCopy,
    copied,
  }: SandpackRendererProps) => {
    console.log("SandpackRenderer", { files, template, dependencies });
    const [activeTab, setActiveTab] = useState<TabType>("preview");
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle fullscreen changes
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

    // Toggle fullscreen
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

    // Process files for Sandpack
    const processedFiles = useMemo(
      () => processFiles(files, template),
      [files, template],
    );

    // Count only visible files (not hidden)
    const visibleFileCount = Object.values(processedFiles).filter(
      (file) => !file.hidden,
    ).length;
    const isMultiFile = visibleFileCount > 1;

    // Get Sandpack template
    const sandpackTemplate = TEMPLATE_CONFIG[template].sandpackTemplate;

    // Custom setup for dependencies
    const customSetup = useMemo(() => {
      if (!dependencies || Object.keys(dependencies).length === 0) {
        return undefined;
      }
      return { dependencies };
    }, [dependencies]);

    return (
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-900 transition-all duration-300 dark:border-gray-700"
      >
        <SandpackProvider
          template={sandpackTemplate}
          files={processedFiles}
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
            {/* Header */}
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

              <ActionButtons
                activeTab={activeTab}
                fileCount={visibleFileCount}
                copied={copied}
                isFullscreen={isFullscreen}
                onCopy={onCopy}
                onToggleFullscreen={toggleFullscreen}
              />
            </div>

            {/* Preview Tab - forceMount to prevent iframe reload */}
            <TabsContent
              value="preview"
              className="mt-0 data-[state=inactive]:hidden"
              forceMount
            >
              <PreviewPanel isFullscreen={isFullscreen} />
            </TabsContent>

            {/* Code Tab */}
            <TabsContent value="code" className="mt-0">
              <CodeEditorPanel
                isFullscreen={isFullscreen}
                showTabs={isMultiFile}
              />
            </TabsContent>
          </Tabs>
        </SandpackProvider>
      </div>
    );
  },
);

SandpackRenderer.displayName = "SandpackRenderer";

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
// Output Content Component (extracted to follow React Hooks rules)
// =============================================================================

interface OutputContentProps {
  output: CodeSandboxOutput;
}

const OutputContent = memo(({ output }: OutputContentProps) => {
  const { files, title: outputTitle, template, dependencies } = output;
  const [copied, setCopied] = useState(false);

  // Concatenate all code for copy functionality
  const allCode = useMemo(() => {
    return Object.entries(files)
      .map(([path, file]) => `// ${path}\n${file.code}`)
      .join("\n\n");
  }, [files]);

  // Count only visible files (not hidden) - consistent with SandpackRenderer
  const visibleFileCount = Object.values(files).filter(
    (file) => !file.hidden,
  ).length;

  // Copy all code to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(allCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy code");
    }
  }, [allCode]);

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
            {visibleFileCount > 1 && (
              <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-600 dark:bg-green-900/30 dark:text-green-400">
                {visibleFileCount} files
              </span>
            )}
          </div>
        </div>

        {/* Sandpack Content */}
        <div className="relative">
          <SandpackRenderer
            files={files}
            template={template}
            dependencies={dependencies}
            onCopy={handleCopy}
            copied={copied}
          />
        </div>
      </div>
    </div>
  );
});

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
  }: {
    toolPart: ToolUIPart;
    isStreaming: boolean;
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

      return <OutputContent output={output} />;
    }

    return null;
  },
);

ToolCodeSandbox.displayName = "ToolCodeSandbox";
