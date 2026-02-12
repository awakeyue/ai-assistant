"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, Loader2, CheckCircle2, MailOpen, RefreshCw } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { IoLogoGithub } from "react-icons/io";
import {
  signUpWithEmail,
  signInWithEmail,
  resendVerificationEmail,
} from "@/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

function LoginPageContent() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle OAuth error from callback redirect
  useEffect(() => {
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      // Map error codes to user-friendly messages
      const errorMessages: Record<string, string> = {
        auth_error: "登录认证失败，请重试",
        access_denied: "您取消了授权或拒绝了访问",
        server_error: "服务器错误，请稍后重试",
      };

      const message =
        errorDescription || errorMessages[error] || `登录失败: ${error}`;
      toast.error(message);

      // Clean up URL params without triggering navigation
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
          // Login success, redirect on client side
          router.push("/chat");
        }
      } else {
        const email = formData.get("email") as string;
        const result = await signUpWithEmail(formData);
        if (result?.error) {
          toast.error(result.error);
        } else if (result?.success) {
          // Show detailed guidance after successful registration
          setRegisteredEmail(email);
        }
      }
    } catch (error: any) {
      toast.error(error?.message || "操作失败");
    } finally {
      // 优化，导航还没调整，loading已经结束
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
        // Start countdown, 60 seconds before allowing resend
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
    } catch (error: any) {
      toast.error(error?.message || "发送失败");
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
    } catch (error: any) {
      toast.error(error?.message || "GitHub 登录失败");
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
    } catch (error: any) {
      toast.error(error?.message || "Google 登录失败");
      setGoogleLoading(false);
    }
  };

  // Registration success guidance page
  if (registeredEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 p-4 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">注册成功！</CardTitle>
            <CardDescription className="text-base">
              我们已向您的邮箱发送了验证邮件
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email info */}
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <MailOpen className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    验证邮件已发送至
                  </p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {registeredEmail}
                  </p>
                </div>
              </div>
            </div>

            {/* Steps guidance */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                接下来请：
              </h4>
              <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="bg-primary/10 text-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                    1
                  </span>
                  <span>打开您的邮箱，查找来自我们的验证邮件</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary/10 text-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                    2
                  </span>
                  <span>点击邮件中的验证链接完成账户激活</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary/10 text-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                    3
                  </span>
                  <span>验证成功后返回登录页面登录</span>
                </li>
              </ol>
            </div>

            {/* Tips */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-900/20">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                💡 <strong>提示：</strong>
                如果没有收到邮件，请检查垃圾邮件文件夹，或点击下方按钮重新发送。
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
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
              <Button className="w-full" onClick={handleBackToLogin}>
                <Mail className="mr-2 h-4 w-4" />
                返回登录
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 p-4 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-primary text-primary-foreground mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold">
            AI
          </div>
          <CardTitle className="text-2xl">
            {isLogin ? "登录到 AI Chat" : "创建账户"}
          </CardTitle>
          <CardDescription>
            {isLogin ? "选择登录方式继续" : "填写以下信息注册账户"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* OAuth login buttons */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={googleLoading || githubLoading || loading}
            >
              {googleLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  正在跳转...
                </>
              ) : (
                <>
                  <FcGoogle className="mr-2 h-4 w-4" />
                  使用 Google 登录
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGithubLogin}
              disabled={githubLoading || googleLoading || loading}
            >
              {githubLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  正在跳转...
                </>
              ) : (
                <>
                  <IoLogoGithub className="mr-2 h-4 w-4" />
                  使用 GitHub 登录
                </>
              )}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background text-muted-foreground px-2">
                或使用邮箱
              </span>
            </div>
          </div>

          {/* Email login/register form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">用户名（可选）</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="请输入用户名"
                  disabled={loading || githubLoading || googleLoading}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="请输入邮箱"
                required
                disabled={loading || githubLoading || googleLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="请输入密码"
                required
                minLength={6}
                disabled={loading || githubLoading || googleLoading}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading || githubLoading || googleLoading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isLogin ? "登录中..." : "注册中..."}
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  {isLogin ? "登录" : "注册"}
                </>
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              {isLogin ? "还没有账户？" : "已有账户？"}
            </span>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary ml-1 font-medium hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading || githubLoading || googleLoading}
            >
              {isLogin ? "立即注册" : "去登录"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 p-4 dark:from-gray-900 dark:to-gray-800">
          <div className="animate-pulse">
            <div className="bg-primary/10 mx-auto mb-4 h-12 w-12 rounded-xl" />
            <div className="bg-muted h-4 w-32 rounded" />
          </div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
