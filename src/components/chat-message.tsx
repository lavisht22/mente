import { Accordion, AccordionItem } from "@heroui/react";
import type { ModelMessage } from "ai";
import type { Tables } from "db.types";
import { useMemo } from "react";
import Markdown from "react-markdown";
import { rehypeInlineCodeProperty } from "react-shiki";
import remarkGfm from "remark-gfm";
import CodeBlock from "./code-block";
import Logo from "./logo";

export type MessageT = Tables<"messages"> & { data: ModelMessage };

interface MessageProps {
  message: MessageT;
  loading?: boolean;
}

function UserMessage({ message }: MessageProps) {
  const text = useMemo(() => {
    if (typeof message.data.content === "string") {
      return message.data.content;
    }

    if (Array.isArray(message.data.content)) {
      return message.data.content
        .filter((c) => c.type === "text")
        .map((c) => c.text)
        .join("\n");
    }
  }, [message]);

  return (
    <div className="flex justify-end">
      <div className="bg-default-200/60 py-2 px-3 rounded-2xl rounded-tr-none max-w-lg">
        <p>{text}</p>
      </div>
    </div>
  );
}

function AssistantMessage({ message, loading }: MessageProps) {
  if (typeof message.data.content === "string") {
    return (
      <div className="flex gap-4">
        <Logo className="mt-1.5 shrink-0" size={4} animation={loading} />
        <div className="prose">
          <Markdown>{message.data.content}</Markdown>
        </div>
      </div>
    );
  }

  return (
    <div>
      {message.data.content.map((part, index) => {
        if (part.type === "text") {
          return (
            <div key={`${message.id}text${index}`} className="flex gap-4">
              <Logo className="mt-1.5 shrink-0" size={4} animation={loading} />
              <div className="prose">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeInlineCodeProperty]}
                  components={{
                    code: CodeBlock,
                  }}
                >
                  {part.text}
                </Markdown>
              </div>
            </div>
          );
        }

        if (part.type === "tool-call") {
          return (
            <Accordion
              key={`${message.id}tool-call${part.toolCallId}`}
              variant="splitted"
            >
              <AccordionItem
                classNames={{
                  trigger: "py-2",
                  title: "font-mono text-sm",
                  base: "-ml-2 -mr-2",
                }}
                textValue={part.toolName}
                key={part.toolCallId}
                title={
                  <span>
                    Using{" "}
                    <span className="underline underline-offset-2">
                      {part.toolName}
                    </span>{" "}
                    tool
                  </span>
                }
              >
                ToolContent
              </AccordionItem>
            </Accordion>
          );
        }
      })}
    </div>
  );
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

  return null;
}
