"use server";

import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

/**
 * 邮箱注册
 */
export async function signUpWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string | undefined;

  if (!email || !password) {
    return { error: "邮箱和密码不能为空" };
  }

  // 检查邮箱是否已存在于数据库
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "该邮箱已被注册" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || email.split("@")[0],
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    // 创建数据库用户记录
    await prisma.user.create({
      data: {
        email,
        name: name || email.split("@")[0],
        supabaseId: data.user.id,
        provider: "email",
      },
    });
  }

  return { success: true };
}

/**
 * 邮箱登录
 */
export async function signInWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "邮箱和密码不能为空" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // 确保数据库中有用户记录
  if (data.user) {
    const existingUser = await prisma.user.findUnique({
      where: { supabaseId: data.user.id },
    });

    if (!existingUser) {
      // 尝试通过邮箱查找用户
      const userByEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (userByEmail) {
        // 更新现有用户的 supabaseId
        await prisma.user.update({
          where: { email },
          data: { supabaseId: data.user.id },
        });
      } else {
        // 创建新用户
        await prisma.user.create({
          data: {
            email,
            name: data.user.user_metadata?.name || email.split("@")[0],
            supabaseId: data.user.id,
            provider: "email",
          },
        });
      }
    }
  }

  // 返回成功状态，让客户端处理重定向
  return { success: true };
}

/**
 * 登出
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/chat/login");
}

/**
 * 获取当前用户
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // 从数据库获取完整用户信息
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
  });

  return dbUser;
}

/**
 * 同步或创建用户 (用于OAuth登录后)
 */
export async function syncOrCreateUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // 查找现有用户
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

  return dbUser;
}
