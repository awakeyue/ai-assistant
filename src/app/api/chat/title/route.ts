import { useModelStore } from "@/store/chat";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { text }: { text: string } = await req.json();

  const { modelList } = useModelStore.getState();
  const modelInfo = modelList.find((model) => model.name === "Doubao-lite-32k");

  if (!modelInfo) {
    return NextResponse.json({ title: text });
  }

  const model = createOpenAICompatible({
    baseURL: modelInfo.baseURL,
    apiKey: modelInfo.apiKey,
    name: modelInfo.name,
  });

  const result = await generateText({
    model: model(modelInfo.id),
    prompt: `你是一个聊天title生成器。请根据用户的提问，考虑ai会怎样回复，然后总结出一个简洁、不超过20个字的中文聊天标题。只输出标题，不要任何其他内容。用户的提问是：${text}`,
    maxOutputTokens: 32,
    temperature: 0.3,
  });

  return NextResponse.json({
    title: result.text.trim(),
  });
}
