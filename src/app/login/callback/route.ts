import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/chat";

  // Handle OAuth error from provider (e.g., user denied access)
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    const errorParams = new URLSearchParams({
      error: error,
      ...(errorDescription && { error_description: errorDescription }),
    });
    return NextResponse.redirect(`${origin}/login?${errorParams.toString()}`);
  }

  if (code) {
    const supabase = await createClient();

    try {
      const { data, error: authError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (authError) {
        console.error("OAuth exchange error:", authError);
        const errorParams = new URLSearchParams({
          error: "auth_error",
          error_description: authError.message || "认证失败",
        });
        return NextResponse.redirect(
          `${origin}/login?${errorParams.toString()}`,
        );
      }

      if (data.user) {
        // 同步或创建数据库用户
        const user = data.user;
        let dbUser = await prisma.user.findUnique({
          where: { supabaseId: user.id },
        });

        if (!dbUser) {
          // 尝试通过邮箱查找
          const userByEmail = user.email
            ? await prisma.user.findUnique({
                where: { email: user.email },
              })
            : null;

          if (userByEmail) {
            // 更新现有用户
            dbUser = await prisma.user.update({
              where: { id: userByEmail.id },
              data: {
                supabaseId: user.id,
                avatarUrl: user.user_metadata?.avatar_url,
                provider: user.app_metadata?.provider || "github",
              },
            });
          } else {
            // 创建新用户
            dbUser = await prisma.user.create({
              data: {
                email: user.email!,
                name:
                  user.user_metadata?.full_name ||
                  user.user_metadata?.name ||
                  user.email?.split("@")[0],
                supabaseId: user.id,
                avatarUrl: user.user_metadata?.avatar_url,
                provider: user.app_metadata?.provider || "github",
              },
            });
          }
        }

        return NextResponse.redirect(`${origin}${next}`);
      }
    } catch (e) {
      console.error("OAuth callback error:", e);
      const errorParams = new URLSearchParams({
        error: "server_error",
        error_description: "服务器处理登录时发生错误",
      });
      return NextResponse.redirect(`${origin}/login?${errorParams.toString()}`);
    }
  }

  // No code provided, redirect to login with error
  return NextResponse.redirect(
    `${origin}/login?error=auth_error&error_description=缺少授权码`,
  );
}
