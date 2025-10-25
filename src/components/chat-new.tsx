import supabase from "@/lib/supabase";
import { useMutation } from "@tanstack/react-query";
import type { FilePart, ImagePart, UserModelMessage } from "ai";
import type { Json } from "db.types";
import { customAlphabet } from "nanoid";
import { useState } from "react";
import ChatInput from "./chat-input";

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 10);

interface ChatProps {
  style?: "floating" | "normal";
  setChatId: (id: string) => void;
}

export default function ChatNew({ style = "normal", setChatId }: ChatProps) {
  const [model, setModel] = useState("gpt-5-chat");

  const createChatMutation = useMutation({
    mutationFn: async (payload: {
      text: string;
      attachments: File[];
      clear: () => void;
    }) => {
      const { text, attachments, clear } = payload;

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

      let uploadedAttachments: Array<ImagePart | FilePart> = [];

      if (attachments) {
        // Upload the files and get their paths
        uploadedAttachments = await Promise.all(
          attachments.map(async (attachment) => {
            const id = nanoid();

            const { data, error } = await supabase.storage
              .from("chats")
              .upload(`${chat.id}/${id}-${attachment.name}`, attachment);

            if (error) {
              throw error;
            }

            if (attachment.type.startsWith("image/")) {
              return {
                type: "image",
                image: data.path,
                mediaType: attachment.type,
              } as ImagePart;
            }

            return {
              type: "file",
              data: data.path,
              mediaType: attachment.type,
            } as FilePart;
          }),
        );
      }

      const userMessage: UserModelMessage = {
        role: "user",
        content: [
          ...uploadedAttachments,
          {
            type: "text",
            text,
          },
        ],
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

      clear();

      return { chat, message };
    },
    onSuccess: ({ chat }) => {
      setChatId(chat.id);
    },
  });

  return (
    <div className="h-full w-full relative flex flex-col">
      <div className="flex-1 p-4 h-full w-full flex flex-col items-center justify-center pb-40">
        <div className="text-center">
          <h3 className="text-2xl text-default-500">Start a new chat</h3>
          <p className="text-default-500">
            Type a message below to start a new conversation.
          </p>
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
