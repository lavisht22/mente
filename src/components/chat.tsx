import { chatMessagesQuery, chatQuery } from "@/lib/queries";

import supabase from "@/lib/supabase";
import { addToast } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AssistantModelMessage,
  TextStreamPart,
  Tool,
  UserModelMessage,
} from "ai";
import type { Json } from "db.types";
import { stream } from "fetch-event-stream";
import { useCallback, useEffect, useRef } from "react";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import ChatInput from "./chat-input";
import Message, { type MessageT } from "./chat-message";
import Logo from "./logo";

interface ChatProps {
  chatId: string;
  style?: "floating" | "normal";
}

export default function Chat({ chatId, style = "normal" }: ChatProps) {
  const virtuoso = useRef<VirtuosoHandle>(null);

  const queryClient = useQueryClient();

  const { data: chat, isLoading: chatLoading } = useQuery(chatQuery(chatId));
  const { data: messages, isLoading: messagesLoading } = useQuery(
    chatMessagesQuery(chatId || ""),
  );

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
    }
  }, [chatId, queryClient]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const userMessage: UserModelMessage = {
        role: "user",
        content,
      };

      const { data: createdMessage, error: messageCreateError } = await supabase
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

      if (virtuoso.current) {
        virtuoso.current.scrollToIndex({
          index: Number.POSITIVE_INFINITY,
          align: "end",
          behavior: "smooth",
        });
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
        continueChat();
      }
    }
  }, [continueChat, messages, sendMutation]);

  if (messagesLoading || chatLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Logo size={4} animation />
      </div>
    );
  }

  return (
    <div className="h-full w-full relative flex flex-col">
      <div className="flex-1">
        <Virtuoso
          ref={virtuoso}
          data={messages}
          initialTopMostItemIndex={messages && messages.length - 1}
          followOutput="smooth"
          itemContent={(_index, message) => {
            return (
              <div
                key={message.id}
                className={"w-full max-w-3xl mx-auto px-4 py-2"}
              >
                <Message message={message as MessageT} />
              </div>
            );
          }}
          className="h-full"
          components={{
            Footer: () => (
              <div className="h-40 px-5 w-full max-w-3xl mx-auto">
                {false && <Logo size={4} animation />}
              </div>
            ), // Needed to avoid last message being hidden behind input
            Header: () => <div className="h-4" />,
            EmptyPlaceholder: () => (
              <div className="h-[calc(100%-12rem)] w-full flex flex-col items-center justify-center">
                <div className="text-center">
                  <h3 className="text-2xl text-default-500">
                    Start a new chat
                  </h3>
                  <p className="text-default-500">
                    Type a message below to start a new conversation.
                  </p>
                </div>
              </div>
            ),
          }}
        />
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
