"use client";

import { ArrowDown } from "lucide-react";

interface ScrollToBottomButtonProps {
  onClick: () => void;
  visible: boolean;
  text?: string;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function ScrollToBottomButton({
  onClick,
  visible,
  loading = false,
  className = "absolute right-1/2 rounded-full translate-x-1/2",
  style = { bottom: "180px" },
}: ScrollToBottomButtonProps) {
  if (!visible) return null;

  return (
    <div className={className} style={style} onClick={onClick}>
      {/* 默认状态 */}
      {!loading && (
        <button className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition-shadow hover:shadow-lg">
          <ArrowDown className="h-5 w-5 text-gray-700" />
        </button>
      )}

      {/* Loading状态 - 双层旋转 */}
      {loading && (
        <button className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md">
          <svg
            className="absolute inset-0 h-full w-full animate-spin"
            viewBox="0 0 40 40"
          >
            <circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeDasharray="20 30"
              strokeLinecap="round"
              opacity="0.8"
            />
          </svg>
          <ArrowDown className="relative z-10 h-5 w-5 text-gray-700" />
        </button>
      )}
    </div>
  );
}
