"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { UIMessage } from "ai";
import { nanoid } from "nanoid";

export interface ChatWithMessages {
  id: string;
  title: string;
  modelId: string;
  createdAt: Date;
  updatedAt: Date;
  messages: {
    id: string;
    role: string;
    content: string;
    parts: any;
    createdAt: Date;
  }[];
}

/**
 * 获取当前用户的所有聊天
 */
export async function getUserChats(): Promise<ChatWithMessages[]> {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  const chats = await prisma.chat.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return chats;
}

/**
 * 获取当前用户的所有聊天（仅列表，不含消息）
 */
export async function getUserChatList() {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  const chats = await prisma.chat.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      modelId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return chats;
}

/**
 * Search user chats with keyword and pagination
 * Returns first assistant message as preview
 */
export async function searchUserChats(params: {
  keyword?: string;
  page?: number;
  pageSize?: number;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return { chats: [], total: 0, hasMore: false };
  }

  const { keyword = "", page = 1, pageSize = 20 } = params;
  const skip = (page - 1) * pageSize;

  const where: any = { userId: user.id };

  if (keyword.trim()) {
    where.title = {
      contains: keyword.trim(),
      mode: "insensitive",
    };
  }

  const [chats, total] = await Promise.all([
    prisma.chat.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        title: true,
        modelId: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          where: { role: "assistant" },
          orderBy: { createdAt: "asc" },
          take: 1,
          select: { content: true },
        },
      },
    }),
    prisma.chat.count({ where }),
  ]);

  const chatsWithPreview = chats.map((chat) => ({
    id: chat.id,
    title: chat.title,
    modelId: chat.modelId,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
    preview: chat.messages[0]?.content?.slice(0, 200) || "",
  }));

  return {
    chats: chatsWithPreview,
    total,
    hasMore: skip + pageSize < total,
  };
}

/**
 * Batch delete chats
 */
export async function batchDeleteChats(chatIds: string[]): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) {
    return false;
  }

  await prisma.chat.deleteMany({
    where: {
      id: { in: chatIds },
      userId: user.id,
    },
  });

  return true;
}

/**
 * 获取单个聊天
 */
export async function getChatById(
  chatId: string,
): Promise<ChatWithMessages | null> {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      userId: user.id,
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return chat;
}

/**
 * 创建新聊天
 * @param modelId - Model ID
 * @param customId - Optional custom chat ID, if not provided, a UUID will be generated
 */
export async function createChat(
  modelId: string,
  customId?: string,
): Promise<{ id: string } | null> {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  // Use custom ID if provided, otherwise generate a UUID
  const chatId = customId || nanoid(10);

  const chat = await prisma.chat.create({
    data: {
      id: chatId,
      modelId,
      userId: user.id,
      title: "新对话",
    },
  });

  // revalidatePath("/chat");
  return { id: chat.id };
}

/**
 * 更新聊天标题
 */
export async function updateChatTitle(
  chatId: string,
  title: string,
): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) {
    return false;
  }

  await prisma.chat.updateMany({
    where: {
      id: chatId,
      userId: user.id,
    },
    data: {
      title,
    },
  });

  // revalidatePath("/chat");
  return true;
}

/**
 * 更新聊天模型
 */
export async function updateChatModel(
  chatId: string,
  modelId: string,
): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) {
    return false;
  }

  await prisma.chat.updateMany({
    where: {
      id: chatId,
      userId: user.id,
    },
    data: {
      modelId,
    },
  });

  return true;
}

/**
 * 删除聊天
 */
export async function deleteChat(chatId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) {
    return false;
  }

  await prisma.chat.deleteMany({
    where: {
      id: chatId,
      userId: user.id,
    },
  });

  // revalidatePath("/chat");
  return true;
}

// 从 UIMessage 的 parts 中提取文本内容
function extractContentFromMessage(msg: UIMessage): string {
  if (!msg.parts || msg.parts.length === 0) {
    return "";
  }

  return msg.parts
    .filter(
      (part): part is { type: "text"; text: string } => part.type === "text",
    )
    .map((part) => part.text)
    .join("");
}

/**
 * 保存聊天消息
 */
export async function saveChatMessages(
  chatId: string,
  messages: UIMessage[],
): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) {
    return false;
  }

  // 验证聊天属于当前用户
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      userId: user.id,
    },
  });

  if (!chat) {
    return false;
  }

  // 删除现有消息并重新创建
  // 为每条消息设置递增的 createdAt，确保排序稳定（每条消息间隔1ms）
  const baseTime = Date.now();
  await prisma.$transaction([
    prisma.message.deleteMany({
      where: { chatId },
    }),
    prisma.message.createMany({
      data: messages.map((msg, index) => ({
        id: msg.id,
        chatId,
        role: msg.role,
        content: extractContentFromMessage(msg),
        parts: msg.parts ? JSON.parse(JSON.stringify(msg.parts)) : null,
        createdAt: new Date(baseTime + index),
      })),
    }),
  ]);

  return true;
}

/**
 * 添加单条消息
 */
export async function addMessage(
  chatId: string,
  message: UIMessage,
): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) {
    return false;
  }

  // 验证聊天属于当前用户
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      userId: user.id,
    },
  });

  if (!chat) {
    return false;
  }

  await prisma.message.create({
    data: {
      id: message.id,
      chatId,
      role: message.role,
      content: extractContentFromMessage(message),
      parts: message.parts ? JSON.parse(JSON.stringify(message.parts)) : null,
    },
  });

  return true;
}

/**
 * 删除消息
 */
export async function deleteMessage(messageId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) {
    return false;
  }

  // 获取消息及其聊天，验证所有权
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { chat: true },
  });

  if (!message || message.chat.userId !== user.id) {
    return false;
  }

  await prisma.message.delete({
    where: { id: messageId },
  });

  return true;
}
