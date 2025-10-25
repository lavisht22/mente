import { chatMessagesQuery, chatQuery } from "@/lib/queries";

import supabase from "@/lib/supabase";
import { addToast } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AssistantModelMessage,
  FilePart,
  ImagePart,
  TextStreamPart,
  Tool,
  UserModelMessage,
} from "ai";
import type { Json } from "db.types";
import { stream } from "fetch-event-stream";
import { customAlphabet } from "nanoid";
import { useCallback, useEffect, useRef } from "react";
import ChatInput from "./chat-input";
import Message, { type MessageT } from "./chat-message";
import Logo from "./logo";

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 10);

interface ChatProps {
  chatId: string;
  style?: "floating" | "normal";
}

export default function Chat({ chatId, style = "normal" }: ChatProps) {
  const queryClient = useQueryClient();

  const { data: chat, isLoading: chatLoading } = useQuery(chatQuery(chatId));
  const { data: messages, isLoading: messagesLoading } = useQuery({
    ...chatMessagesQuery(chatId || ""),
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const lastScrollPositionRef = useRef<number>(0);
  const hasUserScrolledUpRef = useRef<boolean>(false);

  // Track scroll position to update the ref
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY < lastScrollPositionRef.current) {
        // User has scrolled up
        console.log("User has scrolled up");
        hasUserScrolledUpRef.current = true;
      }

      lastScrollPositionRef.current = window.scrollY;
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Helper function to scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  const continueChat = useCallback(async () => {
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
        body: JSON.stringify({ chat_id: chatId }),
        method: "POST",
        signal: abort.signal,
      },
    );

    hasUserScrolledUpRef.current = false;

    const idMap = new Map<string, string>();

    for await (const chunk of res) {
      if (!chunk.data) continue;

      const parsed = JSON.parse(chunk.data) as
        | TextStreamPart<{
            [key: string]: Tool<unknown, unknown>;
          }>
        | { type: "chat-name"; name: string };

      if (parsed.type === "tool-call") {
        queryClient.setQueryData(["chat_messages", chatId], (old) => {
          return [
            ...((old as Array<unknown>) || []),
            {
              id: crypto.randomUUID(),
              chat_id: chatId,
              created_at: new Date().toISOString(),
              data: {
                role: "assistant",
                content: [parsed],
              },
            } as MessageT,
          ];
        });
      }

      if (parsed.type === "tool-result") {
        queryClient.setQueryData(["chat_messages", chatId], (old) => {
          return [
            ...((old as Array<unknown>) || []),
            {
              id: crypto.randomUUID(),
              chat_id: chatId,
              created_at: new Date().toISOString(),
              data: {
                role: "tool",
                content: [parsed],
              },
            } as MessageT,
          ];
        });
      }

      if (parsed.type === "text-start") {
        const messageId = crypto.randomUUID();
        idMap.set(parsed.id, messageId);

        queryClient.setQueryData(["chat_messages", chatId], (old) => {
          return [
            ...((old as Array<unknown>) || []),
            {
              id: messageId,
              chat_id: chatId,
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
            } as MessageT,
          ];
        });
      }

      if (parsed.type === "text-delta") {
        const messageId = idMap.get(parsed.id);
        if (!messageId) continue;

        queryClient.setQueryData(["chat_messages", chatId], (old) => {
          return (old as MessageT[]).map((message) => {
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
          });
        });
      }

      if (parsed.type === "chat-name") {
        queryClient.invalidateQueries({ queryKey: ["chats"] });
        queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
      }

      if (!hasUserScrolledUpRef.current) {
        scrollToBottom("smooth");
      }
    }
  }, [chatId, queryClient, scrollToBottom]);

  const sendMutation = useMutation({
    mutationFn: async (payload?: {
      text: string;
      attachments: File[];
      clear: () => void;
    }) => {
      if (payload) {
        const { text, attachments, clear } = payload;

        if (text.length === 0) {
          return;
        }

        let uploadedAttachments: Array<ImagePart | FilePart> = [];

        if (attachments) {
          // Upload the files and get their paths
          uploadedAttachments = await Promise.all(
            attachments.map(async (attachment) => {
              const id = nanoid();

              const { data, error } = await supabase.storage
                .from("chats")
                .upload(`${chatId}/${id}-${attachment.name}`, attachment);

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

        const { data: createdMessage, error: messageCreateError } =
          await supabase
            .from("messages")
            .insert({
              chat_id: chatId,
              data: userMessage as Json,
            })
            .select()
            .single();

        if (messageCreateError) {
          throw messageCreateError;
        }

        queryClient.setQueryData(["chat_messages", chatId], (old) => {
          return [...((old as Array<unknown>) || []), createdMessage];
        });

        clear();

        // Always scroll to bottom when user sends a message
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }

      await continueChat();
    },
  });

  const updateModelMutation = useMutation({
    mutationFn: async (newModel: string) => {
      await supabase
        .from("chats")
        .update({ model: newModel })
        .eq("id", chatId)
        .throwOnError();
    },
    onMutate: async (newModel) => {
      const previousChat = queryClient.getQueryData(["chat", chatId]);

      queryClient.setQueryData(["chat", chatId], (old) => {
        if (!old) return old;
        return { ...old, model: newModel };
      });

      return { previousChat };
    },
    onError: (_err, _newModel, context) => {
      addToast({
        title: "Error",
        description: "Failed to update model. Please try again.",
        color: "danger",
      });
      if (context?.previousChat) {
        queryClient.setQueryData(["chat", chatId], context.previousChat);
      }
    },
  });

  useEffect(() => {
    if (sendMutation.isPending) return;

    if (messages && messages.length === 1) {
      const firstMessage = messages[0] as MessageT;

      if (firstMessage.data.role === "user") {
        sendMutation.mutate(undefined);
      }
    }
  }, [messages, sendMutation]);

  if (messagesLoading || chatLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Logo size={4} animation />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col justify-between overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {messages?.map((message) => (
          <Message key={message.id} message={message as MessageT} />
        ))}
        {sendMutation.isPending && (
          <div className="w-full max-w-2xl mx-auto p-4">
            <Logo size={4} animation />
          </div>
        )}
        <div className="h-8 w-full" />
        <div ref={bottomRef} />
      </div>

      <ChatInput
        style={style}
        send={sendMutation.mutate}
        sending={sendMutation.isPending}
        model={chat?.model || "gpt-5-chat"}
        onModelChange={updateModelMutation.mutate}
      />
    </div>
  );
}
