import { streamText, UIMessage, convertToModelMessages, stepCountIs } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { decryptApiKey } from "@/lib/crypto";
import { ChatCapabilities, ModelExtraOptions } from "@/types/chat";
import { tools, getFilteredTools, type ToolKey } from "@/ai/tools";

export async function POST(req: Request) {
  const {
    messages,
    modelId,
    enabledTools,
  }: {
    messages: UIMessage[];
    modelId: string;
    capabilities?: ChatCapabilities;
    enabledTools?: ToolKey[];
  } = await req.json();

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

  const providerName = "doubao"; // 只是一个标识，可随意填写，但是一定不能包含特殊字符，比如"."，否则会导致透传参数失败

  const model = createOpenAICompatible({
    baseURL: modelConfig.baseURL,
    apiKey: apiKey,
    name: providerName,
  });

  // Parse extra options from model config - passthrough all fields directly
  const extraOptions = (modelConfig.extraOptions as ModelExtraOptions) || {};

  // Filter tools based on user selection (default to all tools if not specified)
  const activeTools = enabledTools ? getFilteredTools(enabledTools) : tools;

  const result = streamText({
    model: model(modelConfig.modelId),
    system: modelConfig.systemPrompt || undefined,
    messages: await convertToModelMessages(messages),
    tools: activeTools,
    stopWhen: stepCountIs(3),
    maxOutputTokens: "codeSandbox" in activeTools ? 32768 : undefined,
    // Passthrough all extra options directly to streamText
    providerOptions: {
      [providerName]: extraOptions,
    },
  });

  return result.toUIMessageStreamResponse();
}
