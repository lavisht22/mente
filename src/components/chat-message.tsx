import type { ModelMessage } from "ai";
import type { Tables } from "db.types";
import AssistantMessage from "./chat-assistant-message";
import UserMessage from "./chat-user-message";

export type MessageT = Tables<"messages"> & { data: ModelMessage };

interface MessageProps {
  message: MessageT;
}

export default function Message({ message, ...props }: MessageProps) {
  if (message.data.role === "user") {
    return (
      <div className="w-full max-w-2xl mx-auto p-6">
        <UserMessage message={message} {...props} />
      </div>
    );
  }

  if (message.data.role === "assistant") {
    return (
      <div className="w-full max-w-2xl mx-auto p-6">
        <AssistantMessage message={message} {...props} />
      </div>
    );
  }

  return <div className="h-[1px]" />;
}
