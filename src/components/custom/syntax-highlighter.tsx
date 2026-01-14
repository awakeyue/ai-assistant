"use client";

import { useEffect, useState, memo } from "react";
import type { BundledLanguage, BundledTheme, HighlighterGeneric } from "shiki";

// Cached highlighter instance - loaded once and reused
let highlighterPromise: Promise<
  HighlighterGeneric<BundledLanguage, BundledTheme>
> | null = null;

// Lazy load the highlighter
async function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = import("shiki").then(async ({ createHighlighter }) => {
      return createHighlighter({
        themes: ["github-dark"],
        langs: [
          "javascript",
          "typescript",
          "python",
          "java",
          "c",
          "cpp",
          "csharp",
          "go",
          "rust",
          "ruby",
          "php",
          "swift",
          "kotlin",
          "sql",
          "html",
          "css",
          "json",
          "yaml",
          "markdown",
          "bash",
          "shell",
          "powershell",
          "dockerfile",
          "text",
        ],
      });
    });
  }
  return highlighterPromise;
}

// Map common language aliases to shiki language names
function normalizeLanguage(lang: string): string {
  const languageMap: Record<string, string> = {
    js: "javascript",
    ts: "typescript",
    tsx: "typescript",
    jsx: "javascript",
    py: "python",
    rb: "ruby",
    sh: "bash",
    zsh: "bash",
    yml: "yaml",
    md: "markdown",
    cs: "csharp",
    "c++": "cpp",
    "c#": "csharp",
    text: "text",
    plaintext: "text",
  };

  const normalized = lang.toLowerCase();
  return languageMap[normalized] || normalized;
}

interface SyntaxHighlighterProps {
  code: string;
  language: string;
}

/**
 * Lazy-loaded syntax highlighter component using shiki
 * Falls back to plain text while loading or on error
 */
const SyntaxHighlighter = memo(
  ({ code, language }: SyntaxHighlighterProps) => {
    const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);

    useEffect(() => {
      let mounted = true;

      // Reset on deps change to show loading state
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHighlightedHtml(null);

      getHighlighter()
        .then((highlighter) => {
          if (!mounted) return;

          const normalizedLang = normalizeLanguage(language);

          // Check if language is loaded, if not fall back to text
          const loadedLangs = highlighter.getLoadedLanguages();
          const langToUse = loadedLangs.includes(normalizedLang)
            ? normalizedLang
            : "text";

          const html = highlighter.codeToHtml(code, {
            lang: langToUse as BundledLanguage,
            theme: "github-dark",
          });

          setHighlightedHtml(html);
        })
        .catch((error) => {
          console.error("Syntax highlighting error:", error);
        });

      return () => {
        mounted = false;
      };
    }, [code, language]);

    // Show plain code while loading or if highlighting failed
    if (!highlightedHtml) {
      return (
        <pre>
          <code className="text-white/80">{code}</code>
        </pre>
      );
    }

    // Render highlighted HTML
    return (
      <div
        className="shiki-wrapper [&>pre]:m-0! [&>pre]:bg-transparent! [&>pre]:p-0!"
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.code === nextProps.code &&
      prevProps.language === nextProps.language
    );
  },
);

SyntaxHighlighter.displayName = "SyntaxHighlighter";

export { SyntaxHighlighter };
