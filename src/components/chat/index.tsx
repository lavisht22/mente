import supabase from "@/lib/supabase";
import { addToast } from "@heroui/react";
import { useEffect, useState } from "react";
import ChatInput from "./input";
import Message from "./message";
import type { ChatT, MessageT } from "./types";

interface ChatProps {
  chatId?: string;
  style?: "floating" | "normal";
}

export default function Chat({ chatId, style = "normal" }: ChatProps) {
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
    <div className="h-full w-full relative">
      <div className="flex flex-col h-full overflow-y-scroll p-4 pb-32 ">
        {messages.map((message) => (
          <div key={message.id} className="w-full max-w-3xl mx-auto">
            <Message message={message} />
          </div>
        ))}
      </div>

      <ChatInput
        style={style}
        chat={chat}
        setChat={setChat}
        messages={messages}
        setMessages={setMessages}
      />
    </div>
  );
}
