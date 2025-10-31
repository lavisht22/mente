import type { ModelMessage } from "ai";
import type { Tables } from "db.types";
import AssistantMessage from "./chat-assistant-message";
import UserMessage from "./chat-user-message";

export type MessageT = Tables<"messages"> & { data: ModelMessage };

interface MessageProps {
  message: MessageT;
  loading: boolean;
}

export default function Message({ message, ...props }: MessageProps) {
  if (message.data.role === "user") {
    return <UserMessage message={message} {...props} />;
  }

  if (message.data.role === "assistant") {
    return <AssistantMessage message={message} {...props} />;
  }

  return <div className="h-[1px]" />;
}
