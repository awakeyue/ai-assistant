"use client";

import { memo, useMemo, useState, useCallback, useRef, useEffect } from "react";
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
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// =============================================================================
// Types
// =============================================================================

/**
 * File configuration for Sandpack
 */
export interface SandpackFileConfig {
  code: string;
  hidden?: boolean;
  active?: boolean;
  readOnly?: boolean;
}

/**
 * Supported template types
 */
export type SupportedTemplate =
  | "static"
  | "react"
  | "react-ts"
  | "vanilla"
  | "vanilla-ts"
  | "vue"
  | "vue-ts";

/**
 * Code sandbox output data structure
 */
export interface CodeSandboxOutput {
  files: Record<string, SandpackFileConfig>;
  title: string;
  template: SupportedTemplate;
  dependencies?: Record<string, string>;
}

type TabType = "preview" | "code";

// =============================================================================
// Template Configuration
// =============================================================================

interface TemplateConfigBase {
  entryFile: string;
  sandpackTemplate: SandpackPredefinedTemplate;
  boilerplate?: Record<string, string>;
}

interface ReactTemplateConfig extends TemplateConfigBase {
  appPattern: RegExp;
  indexFile: string;
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

function isReactTemplateConfig(
  config: TemplateConfig,
): config is ReactTemplateConfig {
  return (
    "appPattern" in config && "generateIndex" in config && "indexFile" in config
  );
}

function normalizeFilePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function processFiles(
  files: Record<string, SandpackFileConfig>,
  template: SupportedTemplate,
): Record<string, SandpackFileConfig> {
  const config = TEMPLATE_CONFIG[template];
  const processedFiles: Record<string, SandpackFileConfig> = {};

  let hasActiveFile = false;
  for (const [path, fileConfig] of Object.entries(files)) {
    const normalizedPath = normalizeFilePath(path);
    processedFiles[normalizedPath] = { ...fileConfig };
    if (fileConfig.active) {
      hasActiveFile = true;
    }
  }

  if (template.startsWith("react") && isReactTemplateConfig(config)) {
    const { appPattern, generateIndex, indexFile } = config;

    const appFilePath = Object.keys(processedFiles).find((path) =>
      appPattern.test(path),
    );

    if (appFilePath && !processedFiles[indexFile]) {
      processedFiles[indexFile] = {
        code: generateIndex(appFilePath),
        hidden: true,
      };
    }
  } else {
    const hasEntryFile = Object.keys(processedFiles).some(
      (path) =>
        path === config.entryFile ||
        (template === "static" && path.includes("index.html")) ||
        (template.startsWith("vue") && path.includes("App.vue")),
    );

    if (!hasEntryFile && config.boilerplate) {
      for (const [path, code] of Object.entries(config.boilerplate)) {
        if (!processedFiles[path]) {
          processedFiles[path] = { code, hidden: true };
        }
      }
    }
  }

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

const PreviewPanel = memo(
  ({
    isFullscreen,
    customHeight,
  }: {
    isFullscreen: boolean;
    customHeight?: string;
  }) => {
    const height = isFullscreen ? "calc(100vh - 60px)" : customHeight || "60vh";

    return (
      <SandpackPreview
        showOpenInCodeSandbox={false}
        showRefreshButton={false}
        style={{ height, minHeight: height }}
      />
    );
  },
);

PreviewPanel.displayName = "PreviewPanel";

const CodeEditorPanel = memo(
  ({
    isFullscreen,
    showTabs,
    customHeight,
  }: {
    isFullscreen: boolean;
    showTabs: boolean;
    customHeight?: string;
  }) => {
    const height = isFullscreen ? "calc(100vh - 60px)" : customHeight || "60vh";

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

const ActionButtons = memo(
  ({
    activeTab,
    fileCount,
    copied,
    isFullscreen,
    onCopy,
    onToggleFullscreen,
    showFullscreenButton = true,
  }: {
    activeTab: TabType;
    fileCount: number;
    copied: boolean;
    isFullscreen: boolean;
    onCopy: () => void;
    onToggleFullscreen: () => void;
    showFullscreenButton?: boolean;
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
      {showFullscreenButton && (
        <button
          onClick={onToggleFullscreen}
          className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-gray-200"
          title={isFullscreen ? "退出全屏" : "全屏"}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      )}
    </div>
  ),
);

ActionButtons.displayName = "ActionButtons";

// =============================================================================
// Main Sandpack Renderer (Exported)
// =============================================================================

export interface SandpackRendererProps {
  files: Record<string, SandpackFileConfig>;
  template: SupportedTemplate;
  dependencies?: Record<string, string>;
  onCopy: () => void;
  copied: boolean;
  showFullscreenButton?: boolean;
  height?: string; // Custom height for the preview/editor panels
}

export const SandpackRenderer = memo(
  ({
    files,
    template,
    dependencies,
    onCopy,
    copied,
    showFullscreenButton = true,
    height,
  }: SandpackRendererProps) => {
    const [activeTab, setActiveTab] = useState<TabType>("preview");
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

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

    const processedFiles = useMemo(
      () => processFiles(files, template),
      [files, template],
    );

    const visibleFileCount = Object.values(processedFiles).filter(
      (file) => !file.hidden,
    ).length;
    const isMultiFile = visibleFileCount > 1;

    const sandpackTemplate = TEMPLATE_CONFIG[template].sandpackTemplate;

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
                showFullscreenButton={showFullscreenButton}
              />
            </div>

            {/* Preview Tab */}
            <TabsContent
              value="preview"
              className="mt-0 data-[state=inactive]:hidden"
              forceMount
            >
              <PreviewPanel isFullscreen={isFullscreen} customHeight={height} />
            </TabsContent>

            {/* Code Tab */}
            <TabsContent value="code" className="mt-0">
              <CodeEditorPanel
                isFullscreen={isFullscreen}
                showTabs={isMultiFile}
                customHeight={height}
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
// Output Content Component (Exported)
// =============================================================================

export interface SandboxPreviewProps {
  output: CodeSandboxOutput;
  showHeader?: boolean;
  showFullscreenButton?: boolean;
  className?: string;
  height?: string; // Custom height for the preview/editor panels
}

export const SandboxPreview = memo(
  ({
    output,
    showHeader = true,
    showFullscreenButton = true,
    className,
    height,
  }: SandboxPreviewProps) => {
    const { files, title: outputTitle, template, dependencies } = output;
    const [copied, setCopied] = useState(false);

    const allCode = useMemo(() => {
      return Object.entries(files)
        .map(([path, file]) => `// ${path}\n${file.code}`)
        .join("\n\n");
    }, [files]);

    const visibleFileCount = Object.values(files).filter(
      (file) => !file.hidden,
    ).length;

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
      <div className={className}>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-linear-to-br from-blue-50 to-cyan-50 shadow-sm dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
          {/* Header */}
          {showHeader && (
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
          )}

          {/* Sandpack Content */}
          <div className="relative">
            <SandpackRenderer
              files={files}
              template={template}
              dependencies={dependencies}
              onCopy={handleCopy}
              copied={copied}
              showFullscreenButton={showFullscreenButton}
              height={height}
            />
          </div>
        </div>
      </div>
    );
  },
);

SandboxPreview.displayName = "SandboxPreview";
