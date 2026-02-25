"use client";

import { memo, useMemo, useRef, useState, useEffect, useCallback } from "react";
import { SandpackProvider, SandpackPreview } from "@codesandbox/sandpack-react";
import {
  TEMPLATE_CONFIG,
  processFiles,
  shouldInjectTailwind,
} from "@/components/tools/sandbox-utils";
import type {
  SupportedTemplate,
  SandpackFileConfig,
} from "@/components/tools/sandbox-utils";

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
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.3);

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
      if (shouldInjectTailwind(files)) {
        return ["https://cdn.tailwindcss.com?file=.js"];
      }
      return undefined;
    }, [files]);

    // Virtual viewport: render at desktop size, then scale down
    const virtualWidth = 1280;
    const virtualHeight = 800;

    // Dynamically calculate scale based on container width
    const updateScale = useCallback(() => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        setScale(containerWidth / virtualWidth);
      }
    }, [virtualWidth]);

    useEffect(() => {
      updateScale();
      const observer = new ResizeObserver(updateScale);
      if (containerRef.current) {
        observer.observe(containerRef.current);
      }
      return () => observer.disconnect();
    }, [updateScale]);

    return (
      <div
        ref={containerRef}
        className="pointer-events-none relative h-full w-full overflow-hidden rounded-lg"
      >
        {/* Render at a large virtual viewport, then scale down for a CodePen-like thumbnail */}
        <div
          style={{
            width: virtualWidth,
            height: virtualHeight,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
          className="absolute top-0 left-0"
        >
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
                height: virtualHeight,
                minHeight: virtualHeight,
                width: virtualWidth,
              }}
            />
          </SandpackProvider>
        </div>
      </div>
    );
  },
);

SandboxCardPreview.displayName = "SandboxCardPreview";
