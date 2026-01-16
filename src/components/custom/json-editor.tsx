"use client";

import { useCallback, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { useTheme } from "next-themes";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string | null;
  className?: string;
  minHeight?: string;
}

export function JsonEditor({
  value,
  onChange,
  placeholder,
  disabled = false,
  error,
  className,
  minHeight = "200px",
}: JsonEditorProps) {
  const { resolvedTheme } = useTheme();

  const extensions = useMemo(() => [json()], []);

  const handleChange = useCallback(
    (val: string) => {
      onChange(val);
    },
    [onChange],
  );

  const handleFormat = useCallback(() => {
    if (!value.trim()) return;

    try {
      const parsed = JSON.parse(value);
      const formatted = JSON.stringify(parsed, null, 2);
      onChange(formatted);
    } catch {
      // If JSON is invalid, don't format
    }
  }, [value, onChange]);

  // Check if formatting is possible
  const canFormat = useMemo(() => {
    if (!value.trim()) return false;
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }, [value]);

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-md border transition-colors",
          error
            ? "border-destructive focus-within:ring-destructive focus-within:ring-1"
            : "border-input focus-within:ring-ring focus-within:ring-1",
          disabled && "cursor-not-allowed opacity-50",
        )}
        style={{ minHeight }}
      >
        <CodeMirror
          value={value}
          onChange={handleChange}
          extensions={extensions}
          theme={resolvedTheme === "dark" ? "dark" : "light"}
          placeholder={placeholder}
          editable={!disabled}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true,
            foldGutter: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            highlightSelectionMatches: true,
          }}
          style={{
            fontSize: "13px",
          }}
          minHeight={minHeight}
          className="[&_.cm-gutters]:bg-muted/30 [&_.cm-editor]:bg-transparent [&_.cm-gutters]:border-r-0"
        />

        {/* Format Button */}
        <div className="absolute top-2 right-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleFormat}
            disabled={disabled || !canFormat}
            className="h-7 px-2 text-xs opacity-70 hover:opacity-100"
          >
            格式化
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-destructive flex items-center gap-1 text-xs">
          <span className="bg-destructive inline-block h-1 w-1 rounded-full" />
          {error}
        </p>
      )}
    </div>
  );
}
