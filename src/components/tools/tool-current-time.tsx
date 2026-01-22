"use client";

import { memo, useState, useEffect } from "react";
import { ToolUIPart } from "ai";
import { Clock, Calendar, Globe } from "lucide-react";

interface TimeResult {
  datetime: string;
  timezone: string;
  timestamp: number;
  formatted: string;
}

/**
 * Tool component for displaying current time
 * Shows formatted time with timezone information
 */
export const ToolCurrentTime = memo(
  ({ toolPart }: { toolPart: ToolUIPart }) => {
    const { state, title } = toolPart;
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    // Parse result from tool output (output is available when state === 'output-available')
    const timeResult =
      state === "output-available"
        ? (toolPart.output as TimeResult | undefined)
        : undefined;

    useEffect(() => {
      if (state === "output-available" && timeResult?.datetime) {
        setCurrentTime(new Date(timeResult.datetime));
      }
    }, [state, timeResult]);

    // Handle different tool states
    if (state === "input-available") {
      return (
        <div className="block-fade-in my-2 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2 text-sm text-blue-600 dark:border-blue-900/30 dark:bg-blue-950/10 dark:text-blue-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span>正在获取 {title}...</span>
        </div>
      );
    }

    if (state === "output-available") {
      const displayTime = currentTime || new Date();
      const formattedDate = displayTime.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      });
      const formattedTime = displayTime.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      const timezone =
        timeResult?.timezone ||
        Intl.DateTimeFormat().resolvedOptions().timeZone;

      return (
        <div className="block-fade-in my-3 w-full max-w-sm">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-linear-to-br from-blue-50 to-indigo-50 shadow-sm dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
            {/* Header */}
            <div className="border-b border-gray-200/50 bg-white/50 px-4 py-2 dark:border-gray-700/50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                <Clock size={16} className="text-blue-500" />
                <span>当前时间</span>
              </div>
            </div>

            {/* Time display */}
            <div className="px-4 py-4">
              <div className="mb-3 text-center">
                <div className="font-mono text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {formattedTime}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Calendar size={14} />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-500">
                  <Globe size={14} />
                  <span className="font-mono text-xs">{timezone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (state === "output-error") {
      return (
        <div className="block-fade-in my-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-950/10">
          <div className="text-sm text-red-600 dark:text-red-400">
            获取时间失败: {title}
          </div>
        </div>
      );
    }

    return null;
  },
);

ToolCurrentTime.displayName = "ToolCurrentTime";
