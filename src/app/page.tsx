import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MessageSquare,
  Sparkles,
  Zap,
  Shield,
  Github,
  Settings2,
  Key,
  Layers,
  ArrowRight,
  Bot,
  Cpu,
} from "lucide-react";

export default function Home() {
  return (
    <div className="bg-background flex h-full flex-col overflow-y-auto">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
              <MessageSquare className="text-primary-foreground h-4 w-4" />
            </div>
            <span className="font-semibold">AI Assistant</span>
          </div>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">登录</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/chat">开始使用</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-1 flex-col">
        <section className="flex flex-col items-center justify-center px-4 py-16 md:py-24">
          <div className="flex max-w-4xl flex-col items-center text-center">
            {/* Badge */}
            <div className="bg-muted text-muted-foreground mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm">
              <Sparkles className="h-4 w-4" />
              <span>支持多种 AI 模型自由切换</span>
            </div>

            {/* Title */}
            <h1 className="text-foreground mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              您的专属
              <span className="from-primary to-primary/60 bg-linear-to-r bg-clip-text text-transparent">
                {" "}
                AI 助手
              </span>
            </h1>

            {/* Description */}
            <p className="text-muted-foreground mb-8 max-w-2xl text-lg">
              自由配置您喜欢的 AI 模型，使用自己的 API
              密钥，享受无限制的智能对话体验。 支持 OpenAI、Claude、Gemini
              等主流大模型。
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="gap-2">
                <Link href="/chat">
                  <MessageSquare className="h-4 w-4" />
                  开始对话
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link href="/settings/models">
                  <Settings2 className="h-4 w-4" />
                  配置模型
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Feature Highlight Section */}
        <section className="bg-muted/30 border-y px-4 py-16">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <h2 className="text-foreground mb-3 text-2xl font-bold sm:text-3xl">
                完全掌控您的 AI 体验
              </h2>
              <p className="text-muted-foreground mx-auto max-w-2xl">
                告别订阅限制，使用自己的 API 密钥，灵活配置各种 AI 模型参数
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <Card className="border-muted bg-background/60 backdrop-blur">
                <CardContent className="p-6">
                  <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                    <Key className="text-primary h-6 w-6" />
                  </div>
                  <h3 className="text-foreground mb-2 text-lg font-semibold">
                    自有 API 密钥
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    使用您自己的 API
                    密钥，数据直连官方服务，无中间商，费用透明可控
                  </p>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="border-muted bg-background/60 backdrop-blur">
                <CardContent className="p-6">
                  <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                    <Layers className="text-primary h-6 w-6" />
                  </div>
                  <h3 className="text-foreground mb-2 text-lg font-semibold">
                    多模型切换
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    在对话中随时切换不同的 AI 模型，为不同任务选择最合适的模型
                  </p>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="border-muted bg-background/60 backdrop-blur">
                <CardContent className="p-6">
                  <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                    <Settings2 className="text-primary h-6 w-6" />
                  </div>
                  <h3 className="text-foreground mb-2 text-lg font-semibold">
                    自定义参数
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    灵活调整模型温度、最大 Token、系统提示词等参数，打造专属体验
                  </p>
                </CardContent>
              </Card>

              {/* Feature 4 */}
              <Card className="border-muted bg-background/60 backdrop-blur">
                <CardContent className="p-6">
                  <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                    <Zap className="text-primary h-6 w-6" />
                  </div>
                  <h3 className="text-foreground mb-2 text-lg font-semibold">
                    流式响应
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    实时流式输出，打字机效果，让对话体验更加流畅自然
                  </p>
                </CardContent>
              </Card>

              {/* Feature 5 */}
              <Card className="border-muted bg-background/60 backdrop-blur">
                <CardContent className="p-6">
                  <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                    <Shield className="text-primary h-6 w-6" />
                  </div>
                  <h3 className="text-foreground mb-2 text-lg font-semibold">
                    安全加密
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    API 密钥本地加密存储，对话数据安全可靠，隐私得到充分保护
                  </p>
                </CardContent>
              </Card>

              {/* Feature 6 */}
              <Card className="border-muted bg-background/60 backdrop-blur">
                <CardContent className="p-6">
                  <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                    <Bot className="text-primary h-6 w-6" />
                  </div>
                  <h3 className="text-foreground mb-2 text-lg font-semibold">
                    历史记录
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    自动保存所有对话历史，跨设备同步，随时回顾和继续之前的对话
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How it works Section */}
        <section className="px-4 py-16">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-12 text-center">
              <h2 className="text-foreground mb-3 text-2xl font-bold sm:text-3xl">
                三步开始使用
              </h2>
              <p className="text-muted-foreground">
                简单配置，即刻拥有强大的 AI 助手
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="bg-primary text-primary-foreground mb-4 flex h-10 w-10 items-center justify-center rounded-full font-bold">
                  1
                </div>
                <h3 className="text-foreground mb-2 font-semibold">登录账户</h3>
                <p className="text-muted-foreground text-sm">
                  使用 GitHub 或邮箱快速登录
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="bg-primary text-primary-foreground mb-4 flex h-10 w-10 items-center justify-center rounded-full font-bold">
                  2
                </div>
                <h3 className="text-foreground mb-2 font-semibold">
                  配置 API 密钥
                </h3>
                <p className="text-muted-foreground text-sm">
                  添加您的 AI 模型 API 密钥
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="bg-primary text-primary-foreground mb-4 flex h-10 w-10 items-center justify-center rounded-full font-bold">
                  3
                </div>
                <h3 className="text-foreground mb-2 font-semibold">开始对话</h3>
                <p className="text-muted-foreground text-sm">
                  选择模型，开启智能对话之旅
                </p>
              </div>
            </div>

            <div className="mt-12 flex justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link href="/chat">
                  立即体验
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto flex flex-col items-center gap-4 px-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="text-muted-foreground h-4 w-4" />
            <span className="text-muted-foreground text-sm">
              支持自定义 AI 大模型 API
            </span>
          </div>
          <Link
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
            href="https://github.com/awakeyue/ai-assistant"
            target="_blank"
          >
            <Github className="h-4 w-4" />
            GitHub
          </Link>
        </div>
      </footer>
    </div>
  );
}
