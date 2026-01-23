"use client";

import { memo } from "react";
import { ToolUIPart } from "ai";
import { Clock, Calendar } from "lucide-react";

/**
 * Tool output type from server
 */
interface CurrentTimeOutput {
  formattedDate: string;
  hours: string;
  minutes: string;
  seconds: string;
  timestamp: string;
}

/**
 * Tool component for displaying current time
 * Shows formatted time with timezone information
 * Time is fetched from server to ensure consistency with AI response
 */
export const ToolCurrentTime = memo(
  ({ toolPart }: { toolPart: ToolUIPart }) => {
    const { state, title } = toolPart;

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
      // Get time data from server output
      const output = toolPart.output as CurrentTimeOutput | undefined;

      // Show skeleton if output is not available yet
      if (!output) {
        return (
          <div className="block-fade-in my-3 w-full max-w-sm">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-linear-to-br from-blue-50 to-indigo-50 shadow-sm dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
              <div className="border-b border-gray-200/50 bg-white/50 px-4 py-2 dark:border-gray-700/50 dark:bg-gray-800/50">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                  <Clock size={16} className="text-blue-500" />
                  <span>当前时间</span>
                </div>
              </div>
              <div className="px-4 py-4">
                <div className="mb-3 text-center">
                  <div className="mx-auto h-10 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="h-5 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          </div>
        );
      }

      const { formattedDate, hours, minutes, seconds } = output;

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
                  <span className="inline-block min-w-10 tabular-nums">
                    {hours}
                  </span>
                  <span className="text-blue-500">:</span>
                  <span className="inline-block min-w-10 tabular-nums">
                    {minutes}
                  </span>
                  <span className="text-blue-500">:</span>
                  <span className="inline-block min-w-10 tabular-nums">
                    {seconds}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Calendar size={14} />
                  <span>{formattedDate}</span>
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
