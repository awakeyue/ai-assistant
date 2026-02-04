"use client";

import { memo, useMemo } from "react";
import {
  SandpackProvider,
  SandpackPreview,
  SandpackPredefinedTemplate,
} from "@codesandbox/sandpack-react";
import type {
  SupportedTemplate,
  SandpackFileConfig,
} from "@/components/tools/sandbox-preview";

// =============================================================================
// Template Configuration (simplified from sandbox-preview.tsx)
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

function shouldInjectTailwind(
  files: Record<string, SandpackFileConfig>,
  dependencies?: Record<string, string>,
): boolean {
  const hasTailwindDependency =
    dependencies &&
    (Object.keys(dependencies).some((dep) => dep.includes("tailwindcss")) ||
      dependencies["tailwindcss"]);

  const hasTailwindCDN = Object.values(files).some((file) =>
    file.code.includes("cdn.tailwindcss.com"),
  );

  return !!hasTailwindDependency && !hasTailwindCDN;
}

// =============================================================================
// Card Preview Component
// =============================================================================

export interface SandboxCardPreviewProps {
  files: Record<string, SandpackFileConfig>;
  template: SupportedTemplate;
  dependencies?: Record<string, string>;
}

/**
 * A lightweight sandbox preview component optimized for card display.
 * Shows only the preview without controls, code editor, or interaction.
 */
export const SandboxCardPreview = memo(
  ({ files, template, dependencies }: SandboxCardPreviewProps) => {
    const processedFiles = useMemo(
      () => processFiles(files, template),
      [files, template],
    );

    const sandpackTemplate = TEMPLATE_CONFIG[template].sandpackTemplate;

    const customSetup = useMemo(() => {
      if (!dependencies || Object.keys(dependencies).length === 0) {
        return undefined;
      }
      return { dependencies };
    }, [dependencies]);

    const externalResources = useMemo(() => {
      if (shouldInjectTailwind(files, dependencies)) {
        return ["https://cdn.tailwindcss.com"];
      }
      return undefined;
    }, [files, dependencies]);

    return (
      <div className="pointer-events-none h-full w-full overflow-hidden rounded-lg">
        <SandpackProvider
          template={sandpackTemplate}
          files={processedFiles}
          customSetup={customSetup}
          theme="light"
          options={{
            externalResources,
            autorun: true,
            autoReload: false,
          }}
        >
          <SandpackPreview
            showOpenInCodeSandbox={false}
            showRefreshButton={false}
            showNavigator={false}
            style={{
              height: "100%",
              minHeight: "100%",
            }}
          />
        </SandpackProvider>
      </div>
    );
  },
);

SandboxCardPreview.displayName = "SandboxCardPreview";
