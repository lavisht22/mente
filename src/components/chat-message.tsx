import type { ModelMessage } from "ai";
import type { Tables } from "db.types";
import AssistantMessage from "./chat-assistant-message";
import ToolMessage from "./chat-tool-message";
import UserMessage from "./chat-user-message";

export default function ChatMessage({
  rawMessage,
  loading,
}: { rawMessage: Tables<"messages">; loading: boolean }) {
  const message = rawMessage as Tables<"messages"> & {
    data: ModelMessage;
  };

  const { role } = message.data;

  if (role === "user") {
    return <UserMessage message={message} />;
  }

  if (role === "assistant") {
    return <AssistantMessage message={message} loading={loading} />;
  }

  if (role === "tool") {
    return <ToolMessage message={message} />;
  }

  return <div className="h-[1px]" />;
}
