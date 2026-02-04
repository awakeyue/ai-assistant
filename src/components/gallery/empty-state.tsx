import Link from "next/link";
import { Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GalleryEmptyStateProps {
  isAdmin?: boolean;
}

export function GalleryEmptyState({ isAdmin = false }: GalleryEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        <Package size={40} className="text-gray-400" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
        {isAdmin ? "暂无用户创建代码沙盒" : "暂无沙盒作品"}
      </h3>
      <p className="mb-6 max-w-md text-center text-gray-500 dark:text-gray-400">
        {isAdmin
          ? "目前还没有用户创建代码沙盒，请等待用户使用代码沙盒功能。"
          : "你还没有创建任何代码沙盒，开始与 AI 对话，使用沙盒功能创建你的第一个作品吧！"}
      </p>
      {!isAdmin && (
        <Button asChild>
          <Link href="/chat" className="inline-flex items-center gap-2">
            <Plus size={16} />
            开始创作
          </Link>
        </Button>
      )}
    </div>
  );
}
