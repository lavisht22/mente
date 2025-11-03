import { AVAILABLE_TOOLS } from "@/lib/tools";
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  Tooltip,
  cn,
  useDisclosure,
} from "@heroui/react";
import type { ModelMessage, TextPart, ToolCallPart } from "ai";
import type { Tables } from "db.types";
import {
  LucideCheck,
  LucideCopy,
  LucideMegaphone,
  LucidePlus,
  LucideRefreshCcw,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import Markdown from "react-markdown";
import { rehypeInlineCodeProperty } from "react-shiki";
import remarkGfm from "remark-gfm";
import CodeBlock from "./code-block";

function ToolCall({ part }: { part: ToolCallPart }) {
  const { isOpen, onOpenChange } = useDisclosure();

  const tool = useMemo(() => {
    return AVAILABLE_TOOLS.find((t) => t.key === part.toolName);
  }, [part.toolName]);

  if (!tool) {
    return null;
  }

  return (
    <>
      <Button
        variant="light"
        size="sm"
        startContent={<tool.icon className="size-4" />}
        onPress={onOpenChange}
      >
        {tool.name} started
      </Button>
      <Drawer
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        backdrop="blur"
        placement="bottom"
        size="xl"
      >
        <DrawerContent>
          <DrawerHeader className="flex flex-col">
            <p>{tool.name}</p>
            <p className="text-sm font-normal">{part.toolCallId}</p>
          </DrawerHeader>
          <DrawerBody>
            <pre className="whitespace-pre-wrap">
              <code>{JSON.stringify(part.input, null, 2)}</code>
            </pre>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}

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
  message: Tables<"messages"> & { data: ModelMessage };
  loading: boolean;
}

export default function AssistantMessage({ message, loading }: MessageProps) {
  // Extract text content from message
  const getMessageText = useCallback(() => {
    if (typeof message.data.content === "string") {
      return message.data.content;
    }

    return message.data.content
      .filter((part) => part.type === "text")
      .map((part) => (part.type === "text" ? part.text : ""))
      .join("\n\n");
  }, [message.data.content]);

  const textParts = useMemo(() => {
    if (typeof message.data.content === "string") {
      return [
        {
          type: "text",
          text: message.data.content,
          providerOptions: message.data.providerOptions,
        },
      ] as TextPart[];
    }

    return message.data.content.filter(
      (part) => part.type === "text",
    ) as TextPart[];
  }, [message]);

  const toolCallParts = useMemo(() => {
    if (typeof message.data.content === "string") {
      return [];
    }

    return message.data.content.filter(
      (part) => part.type === "tool-call",
    ) as ToolCallPart[];
  }, [message]);

  return (
    <div>
      {textParts.length > 0 && (
        <div className="py-6">
          {textParts.map((part, index) => (
            <div
              key={`${message.id}text${index}`}
              className={cn("gap-4 w-full overflow-hidden prose", {})}
            >
              <Markdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeInlineCodeProperty]}
                components={{
                  code: CodeBlock,
                  a: ({ href, children, ...props }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {part.text}
              </Markdown>
            </div>
          ))}

          {loading === false && (
            <MessageActions messageText={getMessageText()} />
          )}
        </div>
      )}

      <div>
        {toolCallParts.map((part) => (
          <ToolCall key={part.toolCallId} part={part} />
        ))}
      </div>
    </div>
  );
}
