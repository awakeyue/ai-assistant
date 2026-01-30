import { cn } from "@/lib/utils";

export function StreamingDots({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "text-muted-foreground inline-flex items-center gap-2 text-sm",
        className,
      )}
    >
      <div className="flex gap-1">
        {[...Array(3)].map((_, i) => (
          <span
            key={i}
            className="size-1.5 animate-[fade_1.4s_ease-in-out_infinite] rounded-full bg-current"
            style={{
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
      <style jsx>{`
        @keyframes fade {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
