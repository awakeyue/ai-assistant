"use client";

import Link from "next/link";
import { FileCode, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SandboxCardPreview } from "./sandbox-card-preview";
import type { SandboxItem } from "@/actions/gallery";

interface SandboxCardProps {
  item: SandboxItem;
  showCreator?: boolean;
}

/**
 * Format date to relative time string in Chinese
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "刚刚";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} 分钟前`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} 小时前`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} 天前`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} 个月前`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} 年前`;
}

// Template display configuration
const TEMPLATE_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  react: {
    label: "React",
    color: "text-cyan-700 dark:text-cyan-400",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/40",
  },
  "react-ts": {
    label: "React TS",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/40",
  },
  vue: {
    label: "Vue",
    color: "text-emerald-700 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/40",
  },
  "vue-ts": {
    label: "Vue TS",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/40",
  },
  vanilla: {
    label: "JavaScript",
    color: "text-yellow-700 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/40",
  },
  "vanilla-ts": {
    label: "TypeScript",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/40",
  },
  static: {
    label: "HTML",
    color: "text-orange-700 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/40",
  },
};

export function SandboxCard({ item, showCreator = false }: SandboxCardProps) {
  const templateConfig = TEMPLATE_CONFIG[item.template] || {
    label: item.template,
    color: "text-gray-700 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-900/40",
  };

  const formattedTime = formatRelativeTime(new Date(item.createdAt));

  return (
    <Link href={`/share/sandbox/${item.chatId}/${item.messageId}`}>
      <Card className="group h-full cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:bg-gray-800/50 dark:hover:bg-gray-800/80">
        {/* Live Preview Area - CodePen style large thumbnail */}
        <CardHeader className="p-0">
          <div className="relative aspect-16/10 overflow-hidden border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <SandboxCardPreview
              files={item.files}
              template={item.template}
              dependencies={item.dependencies}
            />
            {/* Hover overlay with gradient */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/15">
              <span className="rounded-full bg-white/95 px-4 py-1.5 text-xs font-medium text-gray-700 opacity-0 shadow-md transition-all duration-300 group-hover:opacity-100 dark:bg-gray-800/95 dark:text-gray-300">
                点击查看详情
              </span>
            </div>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="px-3 pb-2">
          <h3 className="mb-2 line-clamp-1 text-sm font-semibold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400">
            {item.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className={`${templateConfig.bgColor} ${templateConfig.color} text-[10px]`}
            >
              {templateConfig.label}
            </Badge>
            <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
              <FileCode size={10} />
              {item.fileCount} 文件
            </span>
          </div>
        </CardContent>

        {/* Footer */}
        <CardFooter className="px-3 pt-0 pb-3">
          <div className="flex w-full items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1">
              <Clock size={10} />
              {formattedTime}
            </span>
            {showCreator && item.creator && (
              <div className="flex items-center gap-1">
                <Avatar className="h-4 w-4">
                  <AvatarImage
                    src={item.creator.avatarUrl || undefined}
                    alt={item.creator.name || "User"}
                  />
                  <AvatarFallback className="text-[8px]">
                    {item.creator.name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-15 truncate">
                  {item.creator.name || "未知"}
                </span>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
