import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Sparkles, Zap, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center px-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
              <MessageSquare className="text-primary-foreground h-4 w-4" />
            </div>
            <span className="font-semibold">AI Assistant</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="flex max-w-2xl flex-col items-center text-center">
          {/* Icon */}
          <div className="bg-muted mb-6 flex h-20 w-20 items-center justify-center rounded-full">
            <span className="text-4xl">✨</span>
          </div>

          {/* Title */}
          <h1 className="text-foreground mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
            欢迎使用 AI Assistant
          </h1>

          {/* Description */}
          <p className="text-muted-foreground mb-8 max-w-md">
            您的智能对话助手，随时为您提供帮助。开始对话，探索 AI 的无限可能。
          </p>

          {/* CTA Button */}
          <Button asChild size="lg" className="gap-2">
            <Link href="/chat">
              <MessageSquare className="h-4 w-4" />
              开始对话
            </Link>
          </Button>

          {/* Features */}
          <div className="mt-16 grid w-full gap-4 sm:grid-cols-3">
            <Card className="border-muted">
              <CardContent className="flex flex-col items-center p-6">
                <div className="bg-muted mb-3 flex h-10 w-10 items-center justify-center rounded-lg">
                  <Zap className="text-muted-foreground h-5 w-5" />
                </div>
                <h3 className="text-foreground mb-1 font-medium">快速响应</h3>
                <p className="text-muted-foreground text-center text-sm">
                  即时回复，高效沟通
                </p>
              </CardContent>
            </Card>

            <Card className="border-muted">
              <CardContent className="flex flex-col items-center p-6">
                <div className="bg-muted mb-3 flex h-10 w-10 items-center justify-center rounded-lg">
                  <Sparkles className="text-muted-foreground h-5 w-5" />
                </div>
                <h3 className="text-foreground mb-1 font-medium">智能对话</h3>
                <p className="text-muted-foreground text-center text-sm">
                  理解上下文，精准回答
                </p>
              </CardContent>
            </Card>

            <Card className="border-muted">
              <CardContent className="flex flex-col items-center p-6">
                <div className="bg-muted mb-3 flex h-10 w-10 items-center justify-center rounded-lg">
                  <Shield className="text-muted-foreground h-5 w-5" />
                </div>
                <h3 className="text-foreground mb-1 font-medium">安全可靠</h3>
                <p className="text-muted-foreground text-center text-sm">
                  数据加密，隐私保护
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4">
        <p className="text-muted-foreground text-center text-sm">
          Powered by AI · Made with ❤️
        </p>
      </footer>
    </div>
  );
}
