import supabase from "@/lib/supabase";
import { Button, Card, CardBody, addToast, cn } from "@heroui/react";
import type {
  AssistantModelMessage,
  TextStreamPart,
  Tool,
  UserModelMessage,
} from "ai";
import type { Json } from "db.types";
import { stream } from "fetch-event-stream";
import { LucideArrowUp } from "lucide-react";
import { useCallback, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import type { ChatT, MessageT } from "./types";

interface ChatInputProps {
  style?: "floating" | "normal";
  chat: ChatT | null;
  setChat: React.Dispatch<React.SetStateAction<ChatT | null>>;
  messages: MessageT[];
  setMessages: React.Dispatch<React.SetStateAction<MessageT[]>>;
}

export default function ChatInput({
  style,
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

      await continueChat();
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
  }, [chat, setChat, setMessages, text, continueChat]);

  return (
    <div
      className={cn("absolute  ", {
        "bottom-6 left-1/2 -translate-x-1/2 w-full max-w-lg":
          style === "normal",
        "bottom-0 left-0 w-full": style === "floating",
      })}
    >
      <Card
        className={cn("h-full", {
          "rounded-t-none shadow-none border-t border-default-200":
            style === "floating",
        })}
      >
        <CardBody>
          <TextareaAutosize
            placeholder="Type a message..."
            className="outline-none resize-none bg-transparent"
            value={text}
            minRows={2}
            maxRows={10}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex justify-between items-center">
            <div />
            <Button
              color="primary"
              isLoading={sending}
              onPress={() => send()}
              isIconOnly
              radius="full"
              size="sm"
            >
              <LucideArrowUp className="size-5" />
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
