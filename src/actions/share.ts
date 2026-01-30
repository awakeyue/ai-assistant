"use server";

import prisma from "@/lib/prisma";
import type { CodeSandboxOutput } from "@/components/tools/sandbox-preview";

/**
 * Get sandbox output for sharing (no auth required)
 * @param chatId - Chat ID
 * @param messageId - Message ID
 * @returns Sandbox output data or null if not found
 */
export async function getSharedSandboxOutput(
  chatId: string,
  messageId: string,
): Promise<CodeSandboxOutput | null> {
  try {
    // Get the message
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        chatId: chatId,
        role: "assistant", // Only assistant messages have tool outputs
      },
    });

    if (!message || !message.parts) {
      return null;
    }

    // Find the tool-codeSandbox part with output-available state
    const parts = message.parts as any[];
    const sandboxPart = parts.find(
      (part) =>
        part.type === "tool-codeSandbox" && part.state === "output-available",
    );

    if (!sandboxPart || !sandboxPart.output) {
      return null;
    }

    // Parse the output if it's a string
    let output: CodeSandboxOutput;
    if (typeof sandboxPart.output === "string") {
      try {
        output = JSON.parse(sandboxPart.output);
      } catch {
        return null;
      }
    } else {
      output = sandboxPart.output;
    }

    // Validate the output structure
    if (!output || !output.files || !output.template) {
      return null;
    }

    return output;
  } catch (error) {
    console.error("[getSharedSandboxOutput] Error:", error);
    return null;
  }
}
