export function CodeSkeletonLoader({
  title = "生成中...",
}: {
  title?: string;
}) {
  return (
    <div className="border-border bg-card rounded-lg border p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-red-400/80" />
        <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
        <div className="h-3 w-3 rounded-full bg-green-400/80" />
        <span className="text-muted-foreground shimmer ml-2 text-xs">
          {title}
        </span>
      </div>
      <div className="space-y-2 font-mono">
        <div className="flex gap-2">
          <div className="bg-muted h-4 w-12 animate-pulse rounded" />
          <div
            className="bg-muted h-4 w-24 animate-pulse rounded"
            style={{ animationDelay: "100ms" }}
          />
        </div>
        <div className="flex gap-2 pl-4">
          <div
            className="bg-muted h-4 w-16 animate-pulse rounded"
            style={{ animationDelay: "200ms" }}
          />
          <div
            className="bg-muted h-4 w-32 animate-pulse rounded"
            style={{ animationDelay: "300ms" }}
          />
        </div>
        <div className="flex gap-2 pl-4">
          <div
            className="bg-muted h-4 w-20 animate-pulse rounded"
            style={{ animationDelay: "400ms" }}
          />
          <div
            className="bg-muted h-4 w-28 animate-pulse rounded"
            style={{ animationDelay: "500ms" }}
          />
        </div>
        <div
          className="bg-muted h-4 w-8 animate-pulse rounded"
          style={{ animationDelay: "600ms" }}
        />
      </div>
    </div>
  );
}
