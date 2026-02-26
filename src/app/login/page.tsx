"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  CheckCircle2,
  MailOpen,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  Workflow,
  Shield,
  Zap,
} from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { IoLogoGithub } from "react-icons/io";
import {
  signUpWithEmail,
  signInWithEmail,
  resendVerificationEmail,
} from "@/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function LoginPageContent() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle OAuth error from callback redirect
  useEffect(() => {
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      const errorMessages: Record<string, string> = {
        auth_error: "登录认证失败，请重试",
        access_denied: "您取消了授权或拒绝了访问",
        server_error: "服务器错误，请稍后重试",
      };

      const message =
        errorDescription || errorMessages[error] || `登录失败: ${error}`;
      toast.error(message);

      window.history.replaceState({}, "", "/login");
    }
  }, [searchParams]);

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);

      if (isLogin) {
        const result = await signInWithEmail(formData);
        if (result?.error) {
          toast.error(result.error);
        } else if (result?.success) {
          router.push("/chat");
        }
      } else {
        const email = formData.get("email") as string;
        const result = await signUpWithEmail(formData);
        if (result?.error) {
          toast.error(result.error);
        } else if (result?.success) {
          setRegisteredEmail(email);
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "操作失败";
      toast.error(message);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    }
  };

  const handleResendEmail = async () => {
    if (!registeredEmail || resendCountdown > 0) return;

    setResendLoading(true);
    try {
      const result = await resendVerificationEmail(registeredEmail);

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("验证邮件已重新发送");
        setResendCountdown(60);
        const timer = setInterval(() => {
          setResendCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "发送失败";
      toast.error(message);
    } finally {
      setResendLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setRegisteredEmail(null);
    setIsLogin(true);
  };

  const handleGithubLogin = async () => {
    setGithubLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/login/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
        setGithubLoading(false);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "GitHub 登录失败";
      toast.error(message);
      setGithubLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/login/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
        setGoogleLoading(false);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Google 登录失败";
      toast.error(message);
      setGoogleLoading(false);
    }
  };

  const anyLoading = loading || githubLoading || googleLoading;

  // Registration success guidance page
  if (registeredEmail) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center p-4">
        <div
          className={cn(
            "w-full max-w-md transition-all duration-500",
            mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          <div className="border-border bg-card rounded-2xl border p-8 shadow-sm backdrop-blur-xl">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 ring-1 ring-green-500/20">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <h1 className="text-foreground text-2xl font-semibold tracking-tight">
                注册成功！
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                我们已向您的邮箱发送了验证邮件
              </p>
            </div>

            <div className="mt-8 space-y-6">
              {/* Email info */}
              <div className="bg-muted/50 ring-border rounded-xl p-4 ring-1">
                <div className="flex items-center gap-3">
                  <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                    <MailOpen className="text-muted-foreground h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-xs">
                      验证邮件已发送至
                    </p>
                    <p className="text-foreground truncate font-medium">
                      {registeredEmail}
                    </p>
                  </div>
                </div>
              </div>

              {/* Steps guidance */}
              <div className="space-y-3">
                <h4 className="text-muted-foreground text-sm font-medium">
                  接下来请：
                </h4>
                <ol className="space-y-3">
                  {[
                    "打开您的邮箱，查找来自我们的验证邮件",
                    "点击邮件中的验证链接完成账户激活",
                    "验证成功后返回登录页面登录",
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="bg-muted text-muted-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                        {i + 1}
                      </span>
                      <span className="text-muted-foreground pt-0.5">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Tips */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  💡 <strong>提示：</strong>
                  如果没有收到邮件，请检查垃圾邮件文件夹，或点击下方按钮重新发送。
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="h-11 w-full rounded-xl"
                  onClick={handleResendEmail}
                  disabled={resendLoading || resendCountdown > 0}
                >
                  {resendLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  {resendCountdown > 0
                    ? `${resendCountdown}秒后可重新发送`
                    : "重新发送验证邮件"}
                </Button>
                <button
                  className="login-gradient-btn flex h-11 w-full items-center justify-center rounded-xl text-sm font-medium transition-opacity hover:opacity-90"
                  onClick={handleBackToLogin}
                >
                  返回登录
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background relative flex min-h-screen">
      {/* Left panel */}
      <div className="relative hidden w-1/2 flex-col justify-between p-10 lg:flex xl:p-14">
        {/* Logo - top left */}
        <div
          className={cn(
            "flex items-center gap-3 transition-all duration-500",
            mounted ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0",
          )}
        >
          <div className="border-border bg-muted/50 flex h-10 w-10 items-center justify-center rounded-xl border">
            <Sparkles className="text-muted-foreground h-5 w-5" />
          </div>
          <span className="text-foreground text-[15px] font-semibold tracking-tight">
            AI Assistant
          </span>
        </div>

        {/* Main content - centered */}
        <div
          className={cn(
            "max-w-lg transition-all delay-100 duration-700",
            mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
          )}
        >
          <h1 className="text-foreground text-[3.25rem] leading-[1.15] font-bold tracking-tight xl:text-[3.75rem]">
            智能对话，
            <br />
            无限可能。
          </h1>

          <p className="text-muted-foreground mt-6 max-w-md text-base leading-relaxed">
            体验新一代 AI 助手，用自然语言完成复杂任务，让创意与效率同行。
          </p>

          {/* Feature highlights */}
          <div className="mt-12 space-y-5">
            {[
              { icon: Workflow, text: "多模型支持，智能路由" },
              { icon: Shield, text: "端到端加密，隐私至上" },
              { icon: Zap, text: "流式响应，零秒级体验" },
            ].map((feature, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-4 transition-all duration-500",
                  mounted
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-4 opacity-0",
                )}
                style={{ transitionDelay: `${400 + i * 100}ms` }}
              >
                <div className="border-border bg-muted/30 flex h-10 w-10 items-center justify-center rounded-xl border">
                  <feature.icon className="text-muted-foreground h-4.5 w-4.5" />
                </div>
                <span className="text-muted-foreground text-sm">
                  {feature.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom spacer */}
        <div />
      </div>

      {/* Right panel - Form */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-10 sm:px-10 lg:px-16">
        <div
          className={cn(
            "w-full max-w-105 transition-all duration-500",
            mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          {/* Mobile logo */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="border-border bg-muted/50 flex h-10 w-10 items-center justify-center rounded-xl border">
              <Sparkles className="text-muted-foreground h-5 w-5" />
            </div>
            <span className="text-foreground text-[15px] font-semibold tracking-tight">
              AI Assistant
            </span>
          </div>

          {/* Form card */}
          <div className="border-border bg-card rounded-2xl border p-8 shadow-sm sm:p-10">
            {/* Header */}
            <div className="mb-8 text-center">
              <h2 className="text-foreground text-xl font-semibold tracking-tight">
                {isLogin ? "欢迎回来" : "创建账户"}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                {isLogin
                  ? "登录您的账户以继续使用"
                  : "填写以下信息开始您的旅程"}
              </p>
            </div>

            {/* OAuth buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-11 rounded-xl transition-colors"
                onClick={handleGoogleLogin}
                disabled={anyLoading}
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <FcGoogle className="mr-2 h-4 w-4" />
                    Google
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="h-11 rounded-xl transition-colors"
                onClick={handleGithubLogin}
                disabled={anyLoading}
              >
                {githubLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <IoLogoGithub className="mr-2 h-4 w-4" />
                    GitHub
                  </>
                )}
              </Button>
            </div>

            {/* Divider */}
            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <div className="border-border w-full border-t" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card text-muted-foreground px-3 text-xs">
                  或使用邮箱登录
                </span>
              </div>
            </div>

            {/* Email form */}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-muted-foreground text-xs font-medium"
                  >
                    用户名（可选）
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="请输入用户名"
                    className="h-11 rounded-xl"
                    disabled={anyLoading}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-muted-foreground text-xs font-medium"
                >
                  邮箱地址
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  className="h-11 rounded-xl"
                  disabled={anyLoading}
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-muted-foreground text-xs font-medium"
                >
                  密码
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="至少 6 个字符"
                    required
                    minLength={6}
                    className="h-11 rounded-xl pr-10"
                    disabled={anyLoading}
                  />
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Gradient submit button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="login-gradient-btn flex h-11 w-full items-center justify-center rounded-xl text-sm font-medium transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
                  disabled={anyLoading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isLogin ? "登录中..." : "注册中..."}
                    </>
                  ) : (
                    <>
                      {isLogin ? "登录" : "注册"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Toggle login/register */}
            <p className="text-muted-foreground mt-7 text-center text-sm">
              {isLogin ? "还没有账户？" : "已有账户？"}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-foreground ml-1 font-medium underline-offset-4 transition-colors hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                disabled={anyLoading}
              >
                {isLogin ? "立即注册" : "去登录"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-muted/50 flex h-11 w-11 items-center justify-center rounded-xl">
              <Sparkles className="text-muted-foreground h-5 w-5 animate-pulse" />
            </div>
            <div className="bg-muted h-1.5 w-24 overflow-hidden rounded-full">
              <div className="bg-muted-foreground/20 h-full w-1/2 animate-[shimmer_1s_ease-in-out_infinite] rounded-full" />
            </div>
          </div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
