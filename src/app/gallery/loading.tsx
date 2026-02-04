import { LayoutGrid } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function SandboxCardSkeleton() {
  return (
    <div className="h-full rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800/50">
      {/* Preview Area */}
      <Skeleton className="mb-3 aspect-video w-full rounded-lg" />

      {/* Title */}
      <Skeleton className="mb-2 h-4 w-3/4" />

      {/* Badges */}
      <div className="mb-3 flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
    </div>
  );
}

export default function GalleryLoading() {
  return (
    <div className="flex h-lvh flex-col bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="shrink-0 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                <LayoutGrid size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  沙盒广场
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  加载中...
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-40 rounded-md" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Skeleton Grid */}
      <main className="mx-auto w-full flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SandboxCardSkeleton key={i} />
            ))}
          </div>

          {/* Pagination Skeleton */}
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-9 rounded-md" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
