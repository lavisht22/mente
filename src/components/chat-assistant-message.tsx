import { Accordion, AccordionItem, Button, Tooltip } from "@heroui/react";
import {
  LucideCheck,
  LucideCopy,
  LucideMegaphone,
  LucidePlus,
  LucideRefreshCcw,
} from "lucide-react";
import { useState } from "react";
import Markdown from "react-markdown";
import { rehypeInlineCodeProperty } from "react-shiki";
import remarkGfm from "remark-gfm";
import type { MessageT } from "./chat-message";
import CodeBlock from "./code-block";

interface MessageActionsProps {
  messageText: string;
}

function MessageActions({ messageText }: MessageActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center mt-4 -ml-2">
      <Tooltip content="Redo">
        <Button
          size="sm"
          isIconOnly
          variant="light"
          isDisabled
          aria-label="Add to note"
        >
          <LucideRefreshCcw className="size-4" />
        </Button>
      </Tooltip>

      <Tooltip content={copied ? "Copied!" : "Copy message"}>
        <Button
          size="sm"
          isIconOnly
          variant="light"
          onPress={handleCopy}
          aria-label={copied ? "Copied!" : "Copy message"}
        >
          {copied ? (
            <LucideCheck className="size-4" />
          ) : (
            <LucideCopy className="size-4" />
          )}
        </Button>
      </Tooltip>
      <Tooltip content="Add to note">
        <Button
          size="sm"
          isIconOnly
          variant="light"
          isDisabled
          aria-label="Add to note"
        >
          <LucidePlus className="size-4" />
        </Button>
      </Tooltip>
      <Tooltip content="Listen">
        <Button
          size="sm"
          isIconOnly
          variant="light"
          isDisabled
          aria-label="Listen"
        >
          <LucideMegaphone className="size-4" />
        </Button>
      </Tooltip>
    </div>
  );
}

interface MessageProps {
  message: MessageT;
  loading: boolean;
}

export default function AssistantMessage({ message, loading }: MessageProps) {
  // Extract text content from message
  const getMessageText = () => {
    if (typeof message.data.content === "string") {
      return message.data.content;
    }

    return message.data.content
      .filter((part) => part.type === "text")
      .map((part) => (part.type === "text" ? part.text : ""))
      .join("\n\n");
  };

  if (typeof message.data.content === "string") {
    return (
      <div className="w-full">
        <div className="gap-4 w-full overflow-hidden prose">
          <Markdown>{message.data.content}</Markdown>
        </div>
        {loading === false && (
          <MessageActions messageText={message.data.content} />
        )}
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
      {loading === false && <MessageActions messageText={getMessageText()} />}
    </div>
  );
}
