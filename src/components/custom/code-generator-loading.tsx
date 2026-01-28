"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// 代码块颜色类型
const blockColors = [
  "bg-purple-400/60", // 关键字 (const, function, return)
  "bg-blue-400/60", // 变量名
  "bg-green-400/60", // 字符串
  "bg-orange-400/60", // 数字/常量
  "bg-pink-400/60", // 类型
  "bg-muted-foreground/30", // 符号/标点
];

// 生成随机的骨架块
function generateRandomBlocks(seed: number) {
  const random = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  const blockCount = Math.floor(random(seed) * 4) + 2; // 2-5个块
  const blocks: { width: number; gap: number; color: string }[] = [];

  for (let i = 0; i < blockCount; i++) {
    blocks.push({
      width: Math.floor(random(seed + i * 100) * 50) + 16, // 16-66px
      gap: Math.floor(random(seed + i * 200) * 8) + 4, // 4-12px gap
      color:
        blockColors[Math.floor(random(seed + i * 300) * blockColors.length)],
    });
  }

  return blocks;
}

// 生成随机缩进
function generateIndent(seed: number): number {
  const random = Math.sin(seed * 9999) * 10000;
  const r = random - Math.floor(random);
  if (r < 0.3) return 0;
  if (r < 0.6) return 1;
  if (r < 0.85) return 2;
  return 3;
}

interface CodeGeneratingLoaderProps {
  className?: string;
  title?: string;
  lineHeight?: number;
  visibleLines?: number;
  totalLines?: number;
}

export function CodeGeneratingLoader({
  className,
  title = "代码生成中...",
  lineHeight = 24,
  visibleLines = 4,
  totalLines = 8,
}: CodeGeneratingLoaderProps) {
  const [currentLine, setCurrentLine] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 预生成所有行的数据
  const lines = useMemo(() => {
    return Array.from({ length: totalLines }, (_, i) => ({
      indent: generateIndent(i),
      blocks: generateRandomBlocks(i),
    }));
  }, [totalLines]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLine((prev) => {
        const next = prev + 1;
        if (next > totalLines + visibleLines) {
          return 0;
        }
        return next;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [totalLines, visibleLines]);

  // 计算滚动偏移
  const scrollOffset = Math.max(0, currentLine - visibleLines) * lineHeight;

  return (
    <div
      className={cn("relative w-full max-w-xl rounded-md border", className)}
    >
      {title && (
        <p className="text-muted-foreground absolute top-1/2 left-1/2 mb-2 translate-x-[-50%] translate-y-[-50%] text-sm">
          {title}
        </p>
      )}
      <div
        ref={containerRef}
        className="bg-muted/30 flex justify-center overflow-hidden rounded-md p-3 opacity-40"
        style={{ height: visibleLines * lineHeight }}
      >
        <div
          className="transition-transform duration-200 ease-out"
          style={{ transform: `translateY(-${scrollOffset}px)` }}
        >
          {lines.map((line, index) => {
            const isVisible = index < currentLine;
            const isLatest = index === currentLine - 1;

            return (
              <div
                key={index}
                className="flex items-center"
                style={{ height: lineHeight, paddingLeft: line.indent * 16 }}
              >
                <div
                  className={cn(
                    "flex items-center gap-1.5 transition-all duration-200",
                    isVisible ? "opacity-100" : "opacity-0",
                  )}
                >
                  {line.blocks.map((block, blockIndex) => (
                    <div
                      key={blockIndex}
                      className={cn(
                        "h-2.5 rounded-sm transition-all duration-200",
                        isLatest ? "animate-pulse" : "",
                        block.color,
                      )}
                      style={{ width: block.width }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
