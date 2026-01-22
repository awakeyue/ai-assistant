"use client";

import {
  Lightbulb,
  Code,
  FileText,
  Sparkles,
  Gamepad2,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickPrompt {
  icon: React.ReactNode;
  title: string;
  prompt: string;
  isToolTrigger?: boolean; // Mark if this prompt triggers a tool
}

const quickPrompts: QuickPrompt[] = [
  {
    icon: <Gamepad2 className="h-4 w-4" />,
    title: "我想下五子棋！",
    prompt: "我想下五子棋！",
    isToolTrigger: true,
  },
  {
    icon: <Timer className="h-4 w-4" />,
    title: "现在几点了？",
    prompt: "现在几点了？",
    isToolTrigger: true,
  },
  {
    icon: <Lightbulb className="h-4 w-4" />,
    title: "帮我想个点子",
    prompt: "帮我想一个有创意的项目点子，可以用来学习编程",
  },
  {
    icon: <Code className="h-4 w-4" />,
    title: "代码解释",
    prompt: "请解释一下 React 中 useEffect 的依赖数组是如何工作的？",
  },
  {
    icon: <FileText className="h-4 w-4" />,
    title: "写一篇文章",
    prompt: "帮我写一篇关于人工智能发展趋势的简短文章",
  },
];

interface QuickPromptsProps {
  onSelect: (prompt: string) => void;
  className?: string;
}

export function QuickPrompts({ onSelect, className }: QuickPromptsProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="text-muted-foreground mb-3 flex items-center justify-center gap-2 text-sm">
        <Sparkles className="h-4 w-4" />
        <span>试试这些</span>
      </div>
      <div className="grid grid-cols-1 gap-2 px-4 sm:flex sm:flex-wrap sm:justify-center sm:gap-3 sm:px-0">
        {quickPrompts.map((item, index) => (
          <button
            key={index}
            onClick={() => onSelect(item.prompt)}
            className={cn(
              "group flex items-center gap-2 rounded-xl border px-3 py-2.5",
              "text-left text-sm",
              "transition-all duration-200 ease-out",
              "active:scale-[0.98]",
              "sm:px-4 sm:py-3",
              // Tool trigger style - gradient border effect
              item.isToolTrigger
                ? [
                    "relative border-transparent bg-linear-to-r from-violet-500/10 via-fuchsia-500/10 to-pink-500/10",
                    "text-foreground",
                    "before:absolute before:inset-0 before:-z-10 before:rounded-xl before:p-px",
                    "before:bg-linear-to-r before:from-violet-500 before:via-fuchsia-500 before:to-pink-500",
                    "before:[mask-composite:xor] before:content-[''] before:[mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]",
                    "hover:from-violet-500/20 hover:via-fuchsia-500/20 hover:to-pink-500/20",
                    "hover:shadow-md hover:shadow-fuchsia-500/10",
                  ]
                : [
                    "border-border/60 bg-card/50",
                    "text-muted-foreground",
                    "hover:border-primary/30 hover:bg-primary/5 hover:text-foreground hover:shadow-sm",
                  ],
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                "transition-colors duration-200",
                item.isToolTrigger
                  ? [
                      "bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400",
                      "group-hover:from-violet-500/30 group-hover:to-fuchsia-500/30",
                    ]
                  : [
                      "bg-muted/50 text-muted-foreground",
                      "group-hover:bg-primary/10 group-hover:text-primary",
                    ],
              )}
            >
              {item.icon}
            </span>
            <span className="truncate font-medium">{item.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
