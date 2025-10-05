import supabase from "@/lib/supabase";
import { addToast } from "@heroui/react";
import { useEffect, useState } from "react";
import ChatInput from "./input";
import type { ChatT, MessageT } from "./types";

interface ChatProps {
  chatId?: string;
}

export default function Chat({ chatId }: ChatProps) {
  const [loading, setLoading] = useState(true);
  const [chat, setChat] = useState<ChatT | null>(null);
  const [messages, setMessages] = useState<MessageT[]>([]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        if (!chatId) {
          return;
        }

        const { data, error } = await supabase
          .from("chats")
          .select("*, messages(*)")
          .eq("id", chatId)
          .single();

        if (error) {
          throw error;
        }

        // Remove messages from the chat object to avoid duplication
        const { messages, ...chatWithoutMessages } = data;

        setChat(chatWithoutMessages);
        setMessages(messages as MessageT[]);
      } catch {
        addToast({
          title: "Error",
          description: "Failed to load chat. Please try again.",
          color: "danger",
        });
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [chatId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-2 ${
              message.data.role === "user" ? "text-right" : "text-left"
            }`}
          >
            {JSON.stringify(message.data)}
          </div>
        ))}
      </div>

      <ChatInput
        chat={chat}
        setChat={setChat}
        messages={messages}
        setMessages={setMessages}
      />
    </div>
  );
}
