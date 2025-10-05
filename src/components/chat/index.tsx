import supabase from "@/lib/supabase";
import { addToast } from "@heroui/react";
import type { ModelMessage, UserModelMessage } from "ai";
import type { Json, Tables } from "db.types";
import { useEffect, useState } from "react";
import ChatInput from "./input";

interface ChatProps {
  chatId?: string;
}

type Chat = Tables<"chats">;

type Message = Tables<"messages"> & { data: ModelMessage };

export default function Chat({ chatId }: ChatProps) {
  const [loading, setLoading] = useState(true);
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

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
        setMessages(messages as Message[]);
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

  const handleSendMessage = async (content: UserModelMessage["content"]) => {
    let currentChat = chat;

    if (!chat) {
      const { data: createdChat, error: chatCreateError } = await supabase
        .from("chats")
        .insert({})
        .select()
        .single();

      if (chatCreateError) {
        throw chatCreateError;
      }

      currentChat = createdChat;
    }

    if (!currentChat) {
      return;
    }

    const userMessage: UserModelMessage = {
      role: "user",
      content,
    };

    const { data: createdMessage, error: messageCreateError } = await supabase
      .from("messages")
      .insert({
        chat_id: currentChat.id,
        data: userMessage as Json,
      })
      .select()
      .single();

    if (messageCreateError) {
      throw messageCreateError;
    }

    setChat(currentChat);
    setMessages((prevMessages) => [...prevMessages, createdMessage as Message]);
  };

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
            {JSON.stringify(message.data.content)}
          </div>
        ))}
      </div>

      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
}
