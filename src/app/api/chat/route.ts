import { streamText, UIMessage, convertToModelMessages } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { useModelStore } from "@/store/chat";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { messages, modelId }: { messages: UIMessage[]; modelId: string } =
    await req.json();

  const { modelList } = useModelStore.getState();
  const modelInfo = modelList.find((model) => model.id === modelId);

  if (!modelInfo) {
    return NextResponse.json({ error: "Model not found" }, { status: 404 });
  }

  const model = createOpenAICompatible({
    baseURL: modelInfo.baseURL,
    apiKey: modelInfo.apiKey,
    name: modelInfo.name,
  });

  const result = streamText({
    model: model(modelInfo.id),
    messages: await convertToModelMessages(messages),
    // providerOptions: {
    //   "volcano-ark": {
    //     thinking: {
    //       type: "disabled",
    //     },
    //   },
    // },
  });

  return result.toUIMessageStreamResponse();
}
