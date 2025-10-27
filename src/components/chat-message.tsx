import { signedURLQuery } from "@/lib/queries";
import {
  Accordion,
  AccordionItem,
  Button,
  Card,
  Spinner,
  cn,
} from "@heroui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { FilePart, ImagePart, ModelMessage } from "ai";
import type { Tables } from "db.types";
import { ChevronDown, LucideFileText } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Markdown from "react-markdown";
import { rehypeInlineCodeProperty } from "react-shiki";
import remarkGfm from "remark-gfm";
import CodeBlock from "./code-block";

export type MessageT = Tables<"messages"> & { data: ModelMessage };

interface MessageProps {
  message: MessageT;
}

function Preview({ attachment }: { attachment: ImagePart | FilePart }) {
  const { data, isPending, isError } = useSuspenseQuery(
    signedURLQuery(
      "chats",
      attachment.type === "image"
        ? (attachment.image as string)
        : (attachment.data as string),
    ),
  );

  const fileName = useMemo(() => {
    if (attachment.type === "image") {
      const parts = (attachment.image as string).split("/");
      return parts[parts.length - 1].split("-").slice(1).join("-");
    }

    const parts = (attachment.data as string).split("/");
    return parts[parts.length - 1].split("-").slice(1).join("-");
  }, [attachment]);

  if (isPending) {
    return (
      <Card className="size-16 flex justify-center items-center">
        <Spinner size="sm" />
      </Card>
    );
  }

  if (isError) {
    return <div>Error loading preview</div>;
  }

  if (attachment.type === "image") {
    return (
      <Card className="size-16 flex justify-center items-center overflow-hidden">
        <img
          src={data}
          alt="attachment"
          className="w-full h-full object-cover rounded-large"
        />
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-36 h-16 space-y-2 p-2">
      <p className="text-sm line-clamp-1 font-medium">{fileName}</p>
      <div className="flex gap-1 items-center">
        <LucideFileText className="size-4" />
        <p className="text-xs">{fileName.split(".").pop()?.toUpperCase()}</p>
      </div>
    </Card>
  );
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

  const attachments = useMemo(() => {
    if (typeof message.data.content === "string") {
      return [];
    }

    return message.data.content.filter(
      (c) => c.type === "file" || c.type === "image",
    );
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
    <div className="flex flex-col items-end w-full">
      {attachments.length > 0 && (
        <div className="mb-2 flex justify-end flex-wrap gap-2">
          {attachments.map((attachment, index) => {
            return (
              <Preview
                key={`${message.id}-attachment-${index}`}
                attachment={attachment}
              />
            );
          })}
        </div>
      )}

      <div className="bg-default-200/60 py-2 px-3 rounded-2xl rounded-tr-none flex max-w-[calc(min(100dvw,_32rem)_-_3rem)]">
        <p
          ref={textRef}
          className={cn("flex-1 whitespace-pre-wrap w-full overflow-hidden", {
            "line-clamp-5": !isExpanded,
          })}
        >
          {text}
        </p>
        {isClamped && (
          <Button
            className="-mr-1 shrink-0"
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

function AssistantMessage({ message }: MessageProps) {
  if (typeof message.data.content === "string") {
    return (
      <div className="gap-4 w-full overflow-hidden prose">
        <Markdown>{message.data.content}</Markdown>
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
              className="gap-4 w-full overflow-hidden prose"
            >
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

  return <div className="h-[1px]" />;
}
