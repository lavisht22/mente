import { Accordion, AccordionItem, Button, cn } from "@heroui/react";
import type { ModelMessage } from "ai";
import type { Tables } from "db.types";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

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

  // Check if the text is actually clamped (overflow)
  useEffect(() => {
    const element = textRef.current;
    if (element) {
      // Check if the scrollHeight is greater than clientHeight (meaning content is clamped)
      setIsClamped(element.scrollHeight > element.clientHeight);
    }
  }, []);

  return (
    <div className="flex justify-end">
      <div className="bg-default-200/60 py-2 px-3 rounded-2xl rounded-tr-none max-w-lg relative flex">
        <p
          ref={textRef}
          className={cn("flex-1 whitespace-pre-wrap", {
            "line-clamp-5": !isExpanded,
          })}
        >
          {text}
        </p>
        {isClamped && (
          <Button
            className="-mr-1"
            isIconOnly
            size="sm"
            variant="light"
            onPress={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? "Collapse message" : "Expand message"}
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
          </Button>
        )}
      </div>
    </div>
  );
}

function AssistantMessage({ message, loading }: MessageProps) {
  if (typeof message.data.content === "string") {
    return (
      <div className="flex gap-4 w-full overflow-hidden">
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
            <div
              key={`${message.id}text${index}`}
              className="flex gap-4 w-full overflow-hidden"
            >
              <Logo className="mt-1.5 shrink-0" size={4} animation={loading} />
              <div className="prose overflow-hidden">
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
      <div className="w-full max-w-2xl mx-auto p-4">
        <UserMessage message={message} {...props} />
      </div>
    );
  }

  if (message.data.role === "assistant") {
    return (
      <div className="w-full max-w-2xl mx-auto p-4">
        <AssistantMessage message={message} {...props} />
      </div>
    );
  }

  return <div className="h-[1px]" />;
}
