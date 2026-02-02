import { MessageSquare, Zap } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  children?: ReactNode;
}

export default function ChatEmptyState({ children }: EmptyStateProps) {
  return (
    <div className="flex min-h-0 w-full flex-1 justify-center overflow-auto px-4 py-8">
      <div className="m-auto flex max-w-lg flex-col items-center text-center">
        <div className="relative mb-8">
          <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
            <MessageSquare className="text-primary h-8 w-8" strokeWidth={2} />
          </div>
          <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
            <Zap className="h-3.5 w-3.5 text-white" fill="currentColor" />
          </div>
        </div>
        <h2 className="text-foreground mb-2 text-2xl font-bold text-balance">
          有什么可以帮你？
        </h2>
        <p className="text-muted-foreground mb-8 text-sm text-pretty">
          提出你的问题，让我们开始对话吧
        </p>
        {children}
      </div>
    </div>
  );
}
