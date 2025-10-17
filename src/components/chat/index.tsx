import supabase from "@/lib/supabase";
import { addToast, cn } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import Logo from "../logo";
import ChatInput from "./input";
import Message from "./message";
import type { ChatT, MessageT } from "./types";

interface ChatProps {
  chatId?: string;
  setChatId: React.Dispatch<React.SetStateAction<string | undefined>>;
  style?: "floating" | "normal";
}

export default function Chat({
  chatId,
  setChatId,
  style = "normal",
}: ChatProps) {
  const [loading, setLoading] = useState(true);
  const [chat, setChat] = useState<ChatT | null>(null);
  const [messages, setMessages] = useState<MessageT[]>([]);
  const [sending, setSending] = useState(false);
  const virtuoso = useRef<VirtuosoHandle>(null);
  const currentChatIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const init = async () => {
      // Skip if chatId hasn't changed
      if (chatId === currentChatIdRef.current) {
        setLoading(false);
        return;
      }

      currentChatIdRef.current = chatId;
      setLoading(true);

      try {
        if (!chatId) {
          setChat(null);
          setMessages([]);
          setLoading(false);
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

  useEffect(() => {
    setChatId(chat?.id);
  }, [chat, setChatId]);

  if (loading) {
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
            Footer: () => (
              <div className="h-40 px-5">
                {sending && <Logo size={4} animation />}
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
        chat={chat}
        setChat={setChat}
        messages={messages}
        setMessages={setMessages}
        sending={sending}
        setSending={setSending}
        virtuoso={virtuoso}
      />
    </div>
  );
}
