import supabase from "@/lib/supabase";
import { Button, Input, addToast } from "@heroui/react";
import type {
  AssistantModelMessage,
  TextStreamPart,
  Tool,
  UserModelMessage,
} from "ai";
import type { Json } from "db.types";
import { stream } from "fetch-event-stream";
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

  const continueChat = useCallback(async () => {
    console.log("Continue chat");
    if (!chat) return;

    const abort = new AbortController();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const res = await stream(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
      {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ chat_id: chat.id }),
        method: "POST",
        signal: abort.signal,
      },
    );

    const idMap = new Map<string, string>();

    for await (const chunk of res) {
      if (!chunk.data) continue;

      const parsed = JSON.parse(chunk.data) as TextStreamPart<{
        [key: string]: Tool<unknown, unknown>;
      }>;

      if (parsed.type === "tool-call") {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            chat_id: chat.id,
            created_at: new Date().toISOString(),
            data: {
              role: "assistant",
              content: [parsed],
            },
          } as MessageT,
        ]);
      }

      if (parsed.type === "tool-result") {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            chat_id: chat.id,
            created_at: new Date().toISOString(),
            data: {
              role: "tool",
              content: [parsed],
            },
          } as MessageT,
        ]);
      }

      if (parsed.type === "text-start") {
        const messageId = crypto.randomUUID();
        idMap.set(parsed.id, messageId);

        setMessages((prev) => [
          ...prev,
          {
            id: messageId,
            chat_id: chat.id,
            created_at: new Date().toISOString(),
            data: {
              role: "assistant",
              content: [
                {
                  type: "text",
                  text: "",
                  providerOptions: parsed.providerMetadata,
                },
              ],
            },
          },
        ]);
      }

      if (parsed.type === "text-delta") {
        console.log("Parsed chunk:", parsed);

        const messageId = idMap.get(parsed.id);

        if (!messageId) continue;

        setMessages((prev) =>
          prev.map((message) => {
            if (message.id !== messageId) {
              return message;
            }

            const messageData = message.data as AssistantModelMessage;
            const content = messageData.content[0];

            if (typeof content === "string") return message;

            if (content.type !== "text") {
              return message;
            }

            return {
              ...message,
              data: {
                ...messageData,
                content: [
                  {
                    ...content,
                    text: content.text + parsed.text,
                  },
                ],
              },
            };
          }),
        );
      }
    }
  }, [chat, setMessages]);

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
    <div className="flex items-center gap-3 p-4 sticky bottom-0 bg-background border-t border-default-200">
      <Input
        placeholder="Type a message..."
        className="flex-1"
        value={text}
        onValueChange={setText}
      />
      <Button isLoading={sending} onPress={() => send()}>
        Send
      </Button>
      <Button onPress={() => continueChat()}>Continue</Button>
    </div>
  );
}
