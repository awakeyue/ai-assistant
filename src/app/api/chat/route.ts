import { streamText, UIMessage, convertToModelMessages } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { decryptApiKey } from "@/lib/crypto";

export async function POST(req: Request) {
  const { messages, modelId }: { messages: UIMessage[]; modelId: string } =
    await req.json();

  // Get current user
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch model configuration from database
  const modelConfig = await prisma.userModel.findFirst({
    where: { id: modelId, OR: [{ userId: user.id }, { isPublic: true }] },
  });

  if (!modelConfig) {
    return NextResponse.json(
      { error: "Model not found or not authorized" },
      { status: 404 },
    );
  }

  // Decrypt API key
  let apiKey: string;
  try {
    apiKey = decryptApiKey(modelConfig.apiKey);
  } catch (error) {
    console.error("Failed to decrypt API key:", error);
    return NextResponse.json(
      { error: "Failed to decrypt API key" },
      { status: 500 },
    );
  }

  const model = createOpenAICompatible({
    baseURL: modelConfig.baseURL,
    apiKey: apiKey,
    name: modelConfig.name,
  });

  const result = streamText({
    model: model(modelConfig.modelId),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
