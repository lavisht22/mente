import supabase from "@/lib/supabase";
import { Button, Card, CardBody, addToast, cn } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type {
  AssistantModelMessage,
  TextStreamPart,
  Tool,
  UserModelMessage,
} from "ai";
import type { Json } from "db.types";
import { stream } from "fetch-event-stream";
import { LucideArrowUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import type { VirtuosoHandle } from "react-virtuoso";
import ModelSelector from "./model-selector";
import type { ChatT, MessageT } from "./types";

interface ChatInputProps {
  style?: "floating" | "normal";
  chat: ChatT | null;
  setChat: React.Dispatch<React.SetStateAction<ChatT | null>>;
  messages: MessageT[];
  setMessages: React.Dispatch<React.SetStateAction<MessageT[]>>;
  sending: boolean;
  setSending: React.Dispatch<React.SetStateAction<boolean>>;
  virtuoso: React.RefObject<VirtuosoHandle | null>;
}

export default function ChatInput({
  style,
  chat,
  setChat,
  messages,
  setMessages,
  sending,
  setSending,
  virtuoso,
}: ChatInputProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [text, setText] = useState("");
  const [model, setModel] = useState(chat?.model || "gemini-2.5-pro");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const continueChat = useCallback(
    async (chat?: ChatT) => {
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

        const parsed = JSON.parse(chunk.data) as
          | TextStreamPart<{
              [key: string]: Tool<unknown, unknown>;
            }>
          | { type: "chat-name"; name: string };

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

        if (parsed.type === "chat-name") {
          setChat((prev) => prev && { ...prev, name: parsed.name });
          queryClient.invalidateQueries({ queryKey: ["chats"] });
        }
      }
    },
    [setMessages, setChat, queryClient],
  );

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
          .insert({ model })
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

      setText("");
      setChat(currentChat);

      if (virtuoso.current) {
        virtuoso.current.scrollToIndex({
          index: Number.POSITIVE_INFINITY,
          align: "end",
          behavior: "smooth",
        });
      }

      setMessages((prevMessages) => [
        ...prevMessages,
        createdMessage as MessageT,
      ]);

      if (style === "floating") {
        await continueChat(currentChat);
      } else {
        navigate({ to: `/chats/${currentChat.id}` });
      }
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        color: "danger",
      });
    } finally {
      setSending(false);
      setText("");
      // Keep focus on the textarea after sending
      textareaRef.current?.focus();
    }
  }, [
    chat,
    setChat,
    setMessages,
    text,
    continueChat,
    setSending,
    virtuoso,
    model,
    navigate,
    style,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (text.trim() && !sending) {
          send();
        }
      }
    },
    [text, sending, send],
  );

  useEffect(() => {
    const updateModel = async () => {
      if (!chat) return;
      if (chat.model === model) return;

      try {
        await supabase
          .from("chats")
          .update({ model })
          .eq("id", chat.id)
          .throwOnError();

        setChat((prev) => prev && { ...prev, model });
      } catch {
        setModel(chat.model);

        addToast({
          title: "Error",
          description: "Failed to update model. Please try again.",
          color: "danger",
        });
      }
    };

    updateModel();
  }, [model, chat, setChat]);

  useEffect(() => {
    const autoContinueChat = async () => {
      if (sending) return;
      if (!chat) return;

      try {
        setSending(true);

        // Check last message if it is from user, then continue the chat
        const lastMessage = messages[messages.length - 1];

        if (lastMessage && lastMessage.data.role === "user") {
          continueChat(chat);
        }
      } catch {
        addToast({
          title: "Error",
          description: "Failed to continue chat. Please try again.",
          color: "danger",
        });
      } finally {
        setSending(false);
        textareaRef.current?.focus();
      }
    };

    autoContinueChat();
  }, [sending, chat, messages, continueChat, setSending]);

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
            ref={textareaRef}
            placeholder="Ask anything..."
            className="outline-none resize-none bg-transparent"
            value={text}
            minRows={2}
            maxRows={10}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex justify-between items-center">
            <div />

            <div className="flex items-center justify-end gap-2 flex-1 w-full">
              <ModelSelector value={model} onValueChange={setModel} />

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
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
