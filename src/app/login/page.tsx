"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Github, Mail, Loader2 } from "lucide-react";
import { signUpWithEmail, signInWithEmail } from "@/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const router = useRouter();

  const handleEmailSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      if (isLogin) {
        const result = await signInWithEmail(formData);
        if (result?.error) {
          toast.error(result.error);
        } else if (result?.success) {
          // 登录成功，客户端重定向
          router.push("/chat");
        }
      } else {
        const result = await signUpWithEmail(formData);
        if (result?.error) {
          toast.error(result.error);
        } else if (result?.success) {
          toast.success("注册成功！请查收验证邮件");
          setIsLogin(true);
        }
      }
    } catch (error: any) {
      toast.error(error?.message || "操作失败");
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setOauthLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/chat/login/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
        setOauthLoading(false);
      }
    } catch (error: any) {
      toast.error(error?.message || "GitHub 登录失败");
      setOauthLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 dark:from-gray-900 dark:to-gray-800">
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
          {/* GitHub 登录按钮 */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGithubLogin}
            disabled={oauthLoading || loading}
          >
            {oauthLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Github className="mr-2 h-4 w-4" />
            )}
            使用 GitHub 登录
          </Button>

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

          {/* 邮箱登录/注册表单 */}
          <form action={handleEmailSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">用户名（可选）</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="请输入用户名"
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
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              {isLogin ? "登录" : "注册"}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              {isLogin ? "还没有账户？" : "已有账户？"}
            </span>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary ml-1 font-medium hover:underline"
            >
              {isLogin ? "立即注册" : "去登录"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
