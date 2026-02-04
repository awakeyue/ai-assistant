import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function SandboxCardSkeleton() {
  return (
    <div className="bg-card border-border h-full rounded-lg border p-3">
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
    <div className="bg-background flex h-lvh flex-col">
      {/* Header */}
      <header className="bg-background/80 shrink-0 border-b backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              {/* Breadcrumb Navigation */}
              <nav className="flex items-center gap-1.5 text-sm">
                <span className="text-muted-foreground">首页</span>
                <ChevronRight className="text-muted-foreground/50 h-4 w-4" />
                <span className="text-foreground font-medium">沙盒广场</span>
              </nav>
              <p className="text-muted-foreground text-sm">加载中...</p>
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
