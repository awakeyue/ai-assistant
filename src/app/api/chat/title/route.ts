import { getCurrentUser } from "@/lib/auth";
import { decryptApiKey } from "@/lib/crypto";
import prisma from "@/lib/prisma";
import { ModelExtraOptions } from "@/types/chat";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { text, modelId }: { text: string; modelId: string } = await req.json();

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

  const extraOptions = (modelConfig.extraOptions as ModelExtraOptions) || {};

  const result = await generateText({
    model: model(modelConfig.modelId),
    prompt: `你是一个聊天title生成器。请根据用户的提问，考虑ai会怎样回复，然后总结出一个简洁、不超过20个字的中文聊天标题。只输出标题，不要任何其他内容。用户的提问是：${text}`,
    maxOutputTokens: 32,
    temperature: 0.3,
    providerOptions: {
      [providerName]: extraOptions,
    },
  });

  return NextResponse.json({
    title: result.text.trim(),
  });
}
