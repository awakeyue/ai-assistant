"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "./auth";
import type {
  SupportedTemplate,
  SandpackFileConfig,
} from "@/components/tools/sandbox-preview";

/**
 * Sandbox item for gallery display
 */
export interface SandboxItem {
  id: string;
  messageId: string;
  chatId: string;
  title: string;
  template: SupportedTemplate;
  fileCount: number;
  files: Record<string, SandpackFileConfig>;
  dependencies?: Record<string, string>;
  createdAt: Date;
  // Only available for admin view
  creator?: {
    id: number;
    name: string | null;
    avatarUrl: string | null;
  };
}

/**
 * Gallery response with pagination info
 */
export interface GalleryResponse {
  items: SandboxItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  isAdmin: boolean;
}

/**
 * Get gallery sandbox list with pagination and permission control
 * @param page - Page number (1-based)
 * @param pageSize - Items per page
 * @param template - Filter by template type (optional)
 * @returns Gallery response with sandbox items and pagination info
 */
export async function getGallerySandboxes(
  page: number = 1,
  pageSize: number = 12,
  template?: SupportedTemplate | "all",
): Promise<GalleryResponse | { error: string }> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { error: "请先登录" };
    }

    const isAdmin = user.role === "admin";

    // Build the where clause based on user role
    const whereClause = isAdmin
      ? {} // Admin can see all
      : {
          chat: {
            userId: user.id,
          },
        };

    // Get all messages that have sandbox parts
    const messages = await prisma.message.findMany({
      where: {
        ...whereClause,
        role: "assistant",
      },
      include: {
        chat: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Type assertion for messages with chat included
    type MessageWithChat = (typeof messages)[number];

    // Filter messages that contain sandbox parts and extract sandbox data
    const sandboxItems: SandboxItem[] = [];

    for (const message of messages as MessageWithChat[]) {
      if (!message.parts) continue;
      const parts = message.parts as any[];
      if (!Array.isArray(parts)) continue;

      // Find sandbox parts with output
      const sandboxParts = parts.filter(
        (part) =>
          part.type === "tool-codeSandbox" && part.state === "output-available",
      );

      for (const sandboxPart of sandboxParts) {
        let output: any;

        // Parse output
        if (typeof sandboxPart.output === "string") {
          try {
            output = JSON.parse(sandboxPart.output);
          } catch {
            continue;
          }
        } else {
          output = sandboxPart.output;
        }

        // Validate output
        if (!output || !output.files || !output.template) {
          continue;
        }

        // Filter by template if specified
        if (template && template !== "all" && output.template !== template) {
          continue;
        }

        // Count visible files
        const fileCount = Object.keys(output.files).filter(
          (path) => !output.files[path].hidden,
        ).length;

        const creator = message.chat.user;

        sandboxItems.push({
          id: `${message.id}-${sandboxParts.indexOf(sandboxPart)}`,
          messageId: message.id,
          chatId: message.chatId,
          title: output.title || "Untitled Sandbox",
          template: output.template,
          fileCount,
          files: output.files,
          dependencies: output.dependencies,
          createdAt: message.createdAt,
          ...(isAdmin && creator
            ? {
                creator: {
                  id: creator.id,
                  name: creator.name,
                  avatarUrl: creator.avatarUrl,
                },
              }
            : {}),
        });
      }
    }

    // Apply pagination
    const total = sandboxItems.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = sandboxItems.slice(
      startIndex,
      startIndex + pageSize,
    );

    return {
      items: paginatedItems,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
      isAdmin,
    };
  } catch (error) {
    console.error("[getGallerySandboxes] Error:", error);
    return { error: "获取沙盒列表失败" };
  }
}
