import supabase from "@/lib/supabase";
import { Button, Input, addToast } from "@heroui/react";
import type { UserModelMessage } from "ai";
import type { Json } from "db.types";
import { useCallback, useState } from "react";
import type { ChatT, MessageT } from "./types";

interface ChatInputProps {
  chat: ChatT | null;
  setChat: React.Dispatch<React.SetStateAction<ChatT | null>>;
  messages: MessageT[];
  setMessages: React.Dispatch<React.SetStateAction<MessageT[]>>;
}

export default function ChatInput({
  chat,
  setChat,
  setMessages,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const send = useCallback(async () => {
    try {
      setSending(true);

      const content: UserModelMessage["content"] = [
        {
          type: "text",
          text,
        },
      ];

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
      setMessages((prevMessages) => [
        ...prevMessages,
        createdMessage as MessageT,
      ]);
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        color: "danger",
      });
    } finally {
      setSending(false);
      setText("");
    }
  }, [chat, setChat, setMessages, text]);

  return (
    <div className="flex items-center p-4">
      <Input
        placeholder="Type a message..."
        className="flex-1"
        value={text}
        onValueChange={setText}
      />
      <Button isLoading={sending} onPress={() => send()}>
        Send
      </Button>
    </div>
  );
}
