import { Accordion, AccordionItem } from "@heroui/react";
import Markdown from "react-markdown";
import { rehypeInlineCodeProperty } from "react-shiki";
import remarkGfm from "remark-gfm";
import type { MessageT } from "./chat-message";
import CodeBlock from "./code-block";

interface MessageProps {
  message: MessageT;
}

export default function AssistantMessage({ message }: MessageProps) {
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
