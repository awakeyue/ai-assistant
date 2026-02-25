import type { SandpackPredefinedTemplate } from "@codesandbox/sandpack-react";

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

// =============================================================================
// Template Configuration
// =============================================================================

interface TemplateConfig {
  /** The main file AI should provide */
  entryFile: string;
  /** Sandpack's predefined template name */
  sandpackTemplate: SandpackPredefinedTemplate;
  /** Fallback boilerplate files if entry file is missing */
  boilerplate?: Record<string, string>;
}

export const TEMPLATE_CONFIG: Record<SupportedTemplate, TemplateConfig> = {
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
  },
  "react-ts": {
    entryFile: "/App.tsx",
    sandpackTemplate: "react-ts",
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

function normalizeFilePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

/**
 * Fix common entry file path mistakes made by AI.
 * E.g. React: /src/App.js -> /App.js, Vue: /App.vue -> /src/App.vue
 */
function fixEntryFilePaths(
  files: Record<string, SandpackFileConfig>,
  template: SupportedTemplate,
): Record<string, SandpackFileConfig> {
  const fixed: Record<string, SandpackFileConfig> = { ...files };

  if (template === "react" || template === "react-ts") {
    // React templates expect /App.js(x) or /App.tsx at root, not under /src/
    const isTs = template === "react-ts";
    const extensions = isTs ? [".tsx", ".ts"] : [".jsx", ".js"];

    for (const ext of extensions) {
      const wrongPath = `/src/App${ext}`;
      const correctPath = `/App${ext}`;
      if (fixed[wrongPath] && !fixed[correctPath]) {
        fixed[correctPath] = fixed[wrongPath];
        delete fixed[wrongPath];
        break;
      }
    }

    // Also fix /src/components/* -> /components/* for consistency
    for (const path of Object.keys(fixed)) {
      if (path.startsWith("/src/") && path !== "/src/App.vue") {
        const newPath = path.replace(/^\/src\//, "/");
        if (!fixed[newPath]) {
          fixed[newPath] = fixed[path];
          delete fixed[path];
        }
      }
    }
  } else if (template === "vue" || template === "vue-ts") {
    // Vue templates expect /src/App.vue, not /App.vue
    if (fixed["/App.vue"] && !fixed["/src/App.vue"]) {
      fixed["/src/App.vue"] = fixed["/App.vue"];
      delete fixed["/App.vue"];
    }
  } else if (template === "vanilla" || template === "vanilla-ts") {
    // Vanilla templates expect /index.js or /index.ts at root
    const ext = template === "vanilla-ts" ? ".ts" : ".js";
    const wrongPath = `/src/index${ext}`;
    const correctPath = `/index${ext}`;
    if (fixed[wrongPath] && !fixed[correctPath]) {
      fixed[correctPath] = fixed[wrongPath];
      delete fixed[wrongPath];
    }
  }

  return fixed;
}

/**
 * Check if Tailwind CSS should be injected via CDN.
 * Always inject by default unless CDN is already present in files.
 */
export function shouldInjectTailwind(
  files: Record<string, SandpackFileConfig>,
): boolean {
  const hasTailwindCDN = Object.values(files).some((file) =>
    file.code.includes("cdn.tailwindcss.com"),
  );
  return !hasTailwindCDN;
}

/**
 * Process files for Sandpack:
 * 1. Fix common AI path mistakes (e.g. /src/App.js -> /App.js for React)
 * 2. Normalize all file paths
 * 3. Ensure one file is marked as active
 */
export function processFiles(
  files: Record<string, SandpackFileConfig>,
  template: SupportedTemplate,
): Record<string, SandpackFileConfig> {
  const config = TEMPLATE_CONFIG[template];

  // Step 1: Fix common AI entry file path mistakes
  const fixedFiles = fixEntryFilePaths(files, template);

  // Step 2: Normalize paths and track active state
  const processedFiles: Record<string, SandpackFileConfig> = {};
  let hasActiveFile = false;

  for (const [path, fileConfig] of Object.entries(fixedFiles)) {
    const normalizedPath = normalizeFilePath(path);
    processedFiles[normalizedPath] = { ...fileConfig };
    if (fileConfig.active) {
      hasActiveFile = true;
    }
  }

  // Step 3: Ensure at least one file is active
  if (!hasActiveFile) {
    const entryFile = config.entryFile;
    // Prefer setting the entry file as active
    if (processedFiles[entryFile]) {
      processedFiles[entryFile] = {
        ...processedFiles[entryFile],
        active: true,
      };
    } else {
      const firstKey = Object.keys(processedFiles)[0];
      if (firstKey) {
        processedFiles[firstKey] = {
          ...processedFiles[firstKey],
          active: true,
        };
      }
    }
  }

  return processedFiles;
}
