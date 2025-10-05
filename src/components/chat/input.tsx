import { Button, Input } from "@heroui/react";
import type { UserModelMessage } from "ai";
import { useState } from "react";

interface ChatInputProps {
  onSendMessage: (content: UserModelMessage["content"]) => void;
}

export default function ChatInput({ onSendMessage }: ChatInputProps) {
  const [text, setText] = useState("");

  return (
    <div className="flex items-center p-4">
      <Input
        placeholder="Type a message..."
        className="flex-1"
        value={text}
        onValueChange={setText}
      />
      <Button
        onPress={() =>
          onSendMessage([
            {
              type: "text",
              text,
            },
          ])
        }
      >
        Send
      </Button>
    </div>
  );
}
