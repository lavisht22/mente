import { Accordion, AccordionItem } from "@heroui/react";
import { useMemo } from "react";
import Markdown from "react-markdown";
import { rehypeInlineCodeProperty } from "react-shiki";
import remarkGfm from "remark-gfm";
import CodeBlock from "../code-block";
import type { MessageT } from "./types";

interface MessageProps {
  message: MessageT;
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
    <div className="flex justify-end mb-8">
      <div className="bg-default-200 py-2 px-3 rounded-3xl rounded-tr-none max-w-lg">
        <p>{text}</p>
      </div>
    </div>
  );
}

function AssistantMessage({ message }: MessageProps) {
  if (typeof message.data.content === "string") {
    return (
      <div className="pl-2 mb-8 prose">
        <Markdown>{message.data.content}</Markdown>
      </div>
    );
  }

  return (
    <div className="">
      {message.data.content.map((part, index) => {
        if (part.type === "text") {
          return (
            <div key={`${message.id}text${index}`} className="pl-2 mb-8 prose">
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
            <div className="mb-2">
              <Accordion
                key={`${message.id}tool-call${part.toolCallId}`}
                className="mb-4"
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
            </div>
          );
        }
      })}
    </div>
  );
}

export default function Message({ message }: MessageProps) {
  if (message.data.role === "user") {
    return <UserMessage message={message} />;
  }

  if (message.data.role === "assistant") {
    return <AssistantMessage message={message} />;
  }

  return null;
}
