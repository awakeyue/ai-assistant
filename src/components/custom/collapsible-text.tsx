import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const CollapsibleText = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [canCollapse, setCanCollapse] = useState(false); // 标记内容是否足够长，需要折叠功能
  const contentRef = useRef<HTMLDivElement>(null);

  const MAX_HEIGHT = 150; // 阈值高度

  useEffect(() => {
    // 确保 DOM 渲染后再检测高度
    const checkOverflow = () => {
      if (contentRef.current) {
        const hasOverflow = contentRef.current.scrollHeight > MAX_HEIGHT;
        // 只有当状态需要改变时才更新状态
        if (hasOverflow !== canCollapse) {
          setCanCollapse(hasOverflow);
        }
      }
    };

    // 在下一帧执行检查，确保DOM已经更新
    const frameId = requestAnimationFrame(checkOverflow);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [children, canCollapse]);

  return (
    <div className="flex min-w-0 flex-col">
      <div
        ref={contentRef}
        className={cn(
          "relative overflow-hidden transition-all duration-300 ease-in-out",
          // 只有当检测到需要折叠(canCollapse) 且 当前未展开(!isExpanded) 时，才限制高度
          canCollapse && !isExpanded ? "max-h-[150px]" : "max-h-none",
        )}
      >
        {children}

        {/* 遮罩层：仅在需要折叠 且 未展开状态显示 */}
        {canCollapse && !isExpanded && (
          <div className="from-primary via-primary/80 pointer-events-none absolute right-0 bottom-0 left-0 h-16 bg-linear-to-t to-transparent" />
        )}
      </div>

      {/* 按钮：仅在需要折叠时显示 */}
      {canCollapse && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="mt-2 flex items-center justify-center gap-1 self-center rounded-full bg-black/10 px-3 py-1 text-xs font-medium text-white/90 transition-colors hover:bg-black/20"
        >
          {isExpanded ? (
            <>
              <ChevronUp size={12} />
              <span>收起</span>
            </>
          ) : (
            <>
              <ChevronDown size={12} />
              <span>展开更多</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
