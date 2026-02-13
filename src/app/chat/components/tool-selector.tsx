"use client";

import { memo, useMemo } from "react";
import { Clock, Grid3X3, Code, Wrench, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { TOOL_REGISTRY, type ToolKey } from "@/ai/tools";
import { useToolSelectStore } from "@/store/tool-select-store";
import { cn } from "@/lib/utils";

// Map icon name strings to actual Lucide icon components
const ICON_MAP: Record<string, LucideIcon> = {
  Clock,
  Grid3X3,
  Code,
};

function ToolSelector({ disabled = false }: { disabled?: boolean }) {
  const { enabledTools, toggleTool } = useToolSelectStore();

  const enabledCount = useMemo(
    () => TOOL_REGISTRY.filter((t) => enabledTools.includes(t.key)).length,
    [enabledTools],
  );

  const totalCount = TOOL_REGISTRY.length;

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type="button"
              title="AI 工具"
              size="sm"
              variant="ghost"
              disabled={disabled}
              className="gap-1.5"
            >
              <Wrench className="h-4 w-4 opacity-80" />
              <span className="text-muted-foreground text-xs">
                {enabledCount}/{totalCount}
              </span>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          管理 AI 工具
        </TooltipContent>
      </Tooltip>

      <PopoverContent align="start" className="w-64 p-2" sideOffset={8}>
        <div className="mb-2 px-2 pt-1">
          <p className="text-muted-foreground text-xs">
            选择 AI 可以使用的工具
          </p>
        </div>
        <div className="space-y-1">
          {TOOL_REGISTRY.map((tool) => (
            <ToolItem
              key={tool.key}
              toolKey={tool.key}
              title={tool.title}
              description={tool.description}
              iconName={tool.icon}
              enabled={enabledTools.includes(tool.key)}
              onToggle={toggleTool}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const ToolItem = memo(function ToolItem({
  toolKey,
  title,
  description,
  iconName,
  enabled,
  onToggle,
}: {
  toolKey: ToolKey;
  title: string;
  description: string;
  iconName: string;
  enabled: boolean;
  onToggle: (key: ToolKey) => void;
}) {
  const Icon = ICON_MAP[iconName] || Wrench;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onToggle(toolKey)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle(toolKey);
        }
      }}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors",
        "hover:bg-accent",
      )}
    >
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
          enabled
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="text-muted-foreground truncate text-xs">{description}</p>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={() => onToggle(toolKey)}
        onClick={(e) => e.stopPropagation()}
        className="shrink-0"
      />
    </div>
  );
});
ToolItem.displayName = "ToolItem";

export default ToolSelector;
