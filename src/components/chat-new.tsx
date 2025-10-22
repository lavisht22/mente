import supabase from "@/lib/supabase";
import { useMutation } from "@tanstack/react-query";
import type { UserModelMessage } from "ai";
import type { Json } from "db.types";
import { useState } from "react";
import ChatInput from "./chat-input";

interface ChatProps {
  style?: "floating" | "normal";
  setChatId: (id: string) => void;
}

export default function ChatNew({ style = "normal", setChatId }: ChatProps) {
  const [model, setModel] = useState("gpt-5-chat");

  const createChatMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data: chat, error: chatError } = await supabase
        .from("chats")
        .insert({
          model,
        })
        .select()
        .single();

      if (chatError) {
        throw chatError;
      }

      const userMessage: UserModelMessage = {
        role: "user",
        content,
      };

      const { data: message, error: messageError } = await supabase
        .from("messages")
        .insert({
          chat_id: chat.id,
          data: userMessage as Json,
        })
        .select()
        .single();

      if (messageError) {
        throw messageError;
      }

      return { chat, message };
    },
    onSuccess: ({ chat }) => {
      setChatId(chat.id);
    },
  });

  return (
    <div className="h-full w-full relative flex flex-col">
      <div className="flex-1">
        <div className="h-[calc(100%-12rem)] w-full flex flex-col items-center justify-center">
          <div className="text-center">
            <h3 className="text-2xl text-default-500">Start a new chat</h3>
            <p className="text-default-500">
              Type a message below to start a new conversation.
            </p>
          </div>
        </div>
      </div>

      <ChatInput
        style={style}
        send={createChatMutation.mutate}
        sending={createChatMutation.isPending}
        model={model}
        onModelChange={setModel}
      />
    </div>
  );
}
