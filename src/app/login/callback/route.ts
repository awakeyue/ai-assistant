import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/chat";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
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
  }

  // 出现错误，返回到登录页并显示错误
  return NextResponse.redirect(`${origin}/chat/login?error=auth_error`);
}
