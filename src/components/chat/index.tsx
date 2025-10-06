import supabase from "@/lib/supabase";
import { addToast, cn } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { Virtuoso } from "react-virtuoso";
import ChatInput from "./input";
import Message from "./message";
import type { ChatT, MessageT } from "./types";

interface ChatProps {
  chatId?: string;
  style?: "floating" | "normal";
}

export default function Chat({ chatId, style = "normal" }: ChatProps) {
  const [loading, setLoading] = useState(true);
  const [chat, setChat] = useState<ChatT | null>(null);
  const [messages, setMessages] = useState<MessageT[]>([]);
  const virtuoso = useRef(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        if (!chatId) {
          setChat(null);
          setMessages([]);
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
        setMessages(messages as MessageT[]);
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-full w-full relative flex flex-col">
      <div className="flex-1">
        <Virtuoso
          ref={virtuoso}
          data={messages}
          initialTopMostItemIndex={messages.length - 1}
          followOutput="smooth"
          itemContent={(_index, message) => {
            return (
              <div
                key={message.id}
                className={cn("w-full max-w-3xl mx-auto px-4 py-2")}
              >
                <Message message={message} />
              </div>
            );
          }}
          className="h-full"
          components={{
            Footer: () => <div className="h-32" />, // Needed to avoid last message being hidden behind input
            Header: () => <div className="h-4" />,
            EmptyPlaceholder: () => (
              <div className="h-[calc(100%-10rem)] w-full flex flex-col items-center justify-center">
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
        chat={chat}
        setChat={setChat}
        messages={messages}
        setMessages={setMessages}
      />
    </div>
  );
}
