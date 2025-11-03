import { chatMessagesQuery, chatQuery } from "@/lib/queries";

import supabase from "@/lib/supabase";
import { Spinner, addToast } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AssistantModelMessage,
  FilePart,
  ImagePart,
  ModelMessage,
  TextStreamPart,
  Tool,
  UserModelMessage,
} from "ai";
import type { Json, Tables } from "db.types";
import { stream } from "fetch-event-stream";
import type { ChatConfig } from "json.types";
import { customAlphabet } from "nanoid";
import { useCallback, useEffect, useRef, useState } from "react";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import AssistantMessage from "./chat-assistant-message";
import ChatInput from "./chat-input";
import ToolMessage from "./chat-tool-message";
import UserMessage from "./chat-user-message";
import Logo from "./logo";

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 10);

interface ChatProps {
  spaceId: string;
  chatId: string;
  style?: "floating" | "normal";
}

export default function Chat({ spaceId, chatId, style = "normal" }: ChatProps) {
  const virtuoso = useRef<VirtuosoHandle>(null);

  const queryClient = useQueryClient();

  const { data: chat, isLoading: chatLoading } = useQuery(chatQuery(chatId));
  const { data: messages, isLoading: messagesLoading } = useQuery({
    ...chatMessagesQuery(chatId || ""),
  });

  const [generating, setGenerating] = useState(false);

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
            },
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
            },
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
            },
          ];
        });
      }

      if (parsed.type === "text-delta") {
        const messageId = idMap.get(parsed.id);
        if (!messageId) continue;

        queryClient.setQueryData(["chat_messages", chatId], (old) => {
          return (old as Tables<"messages">[]).map((message) => {
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

      // if (!hasUserScrolledUpRef.current) {
      //   scrollToBottom("smooth");
      // }
    }
  }, [chatId, queryClient]);

  const sendMutation = useMutation({
    mutationFn: async (payload?: {
      text: string;
      attachments: File[];
      clear: () => void;
    }) => {
      try {
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
          if (virtuoso.current) {
            virtuoso.current.scrollToIndex({
              index: Number.POSITIVE_INFINITY,
              align: "end",
              behavior: "smooth",
            });
          }
        }

        setGenerating(true);
        await continueChat();
      } catch (error) {
        addToast({
          title: "Error",
          description:
            "There was some error processing this request. Please try again.",
          color: "danger",
        });
        throw error;
      } finally {
        setGenerating(false);
      }
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (newConfig: ChatConfig) => {
      await supabase
        .from("chats")
        .update({ config: newConfig })
        .eq("id", chatId)
        .throwOnError();
    },
    onMutate: async (newConfig) => {
      const previousChat = queryClient.getQueryData(["chat", chatId]);

      queryClient.setQueryData(["chat", chatId], (old) => {
        if (!old) return old;

        return { ...old, config: newConfig };
      });

      return { previousChat };
    },
    onError: (_err, _newConfig, context) => {
      addToast({
        title: "Error",
        description: "Failed to update chat config. Please try again.",
        color: "danger",
      });

      if (context?.previousChat) {
        queryClient.setQueryData(["chat", chatId], context.previousChat);
      }
    },
  });

  useEffect(() => {
    if (sendMutation.isPending) return;

    const lastMessage = messages?.[
      messages.length - 1
    ] as Tables<"messages"> & {
      data: ModelMessage;
    };

    if (lastMessage?.data.role === "user") {
      sendMutation.mutate(undefined);
    }
  }, [messages, sendMutation]);

  if (messagesLoading || chatLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Spinner variant="wave" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1">
        <Virtuoso
          ref={virtuoso}
          className="h-full"
          data={messages}
          initialTopMostItemIndex={messages && messages.length - 1}
          followOutput="auto"
          itemContent={(index, rawMessage) => {
            const message = rawMessage as Tables<"messages"> & {
              data: ModelMessage;
            };
            const { role } = message.data;

            if (role === "user") {
              return (
                <div key={message.id} className="w-full max-w-2xl mx-auto p-6">
                  <UserMessage message={message} />
                </div>
              );
            }

            if (role === "assistant") {
              return (
                <div key={message.id} className="w-full max-w-2xl mx-auto px-6">
                  <AssistantMessage
                    message={message}
                    loading={
                      messages
                        ? index === messages.length - 1 && generating
                        : false
                    }
                  />
                </div>
              );
            }

            if (role === "tool") {
              return (
                <div key={message.id} className="w-full max-w-2xl mx-auto px-6">
                  <ToolMessage message={message} />
                </div>
              );
            }

            return <div key={message.id} className="h-[1px]" />;
          }}
          components={{
            Footer: () => (
              <div className="w-full max-w-2xl mx-auto px-4 h-16 flex items-center">
                {generating && <Logo animation={true} />}
              </div>
            ),
          }}
        />
      </div>

      <ChatInput
        spaceId={spaceId}
        style={style}
        send={sendMutation.mutate}
        sending={sendMutation.isPending}
        config={chat?.config as ChatConfig}
        setConfig={updateConfigMutation.mutate}
      />
    </div>
  );
}
