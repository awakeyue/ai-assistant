import ChatArea from "../components/chat-area";
import { getChatById } from "@/actions/chat";
import { redirect } from "next/navigation";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id?: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  console.log("params id", id);
  const chatId = id?.[0] || null;
  let initialMessages: any[] = [];

  if (chatId) {
    const chat = await getChatById(chatId);
    if (chat) {
      initialMessages = chat.messages.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
        parts: msg.parts || undefined,
      }));
    } else {
      // Chat not found, redirect to new chat
      redirect("/chat");
    }
  }

  return (
    <ChatArea
      key={chatId ?? "new-chat"}
      initialMessages={initialMessages}
      chatId={chatId}
    />
  );
}
