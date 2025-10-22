import {
  Button,
  Card,
  CardBody,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  cn,
  useDisclosure,
} from "@heroui/react";

import { LucideArrowUp, LucideChevronUp, LucideLightbulb } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";

const MODELS = [
  {
    key: "gpt-5",
    thinking: true,
  },
  {
    key: "gpt-5-chat",
    thinking: false,
  },
  {
    key: "gemini-2.5-pro",
    thinking: true,
  },
  {
    key: "gemini-2.5-flash",
    thinking: true,
  },
];

interface ChatInputProps {
  style?: "floating" | "normal";
  send: (text: string) => void;
  sending: boolean;
  model: string;
  onModelChange: (value: string) => void;
}

export default function ChatInput({
  style,
  send,
  sending,
  model,
  onModelChange,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const { isOpen, onOpenChange } = useDisclosure();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();

        if (text.trim() && !sending) {
          send(text);
          setText("");
        }
      }
    },
    [text, send, sending],
  );

  return (
    <div
      className={cn("relative", {
        "w-full mx-auto max-w-2xl px-4 pb-6": style === "normal",
        "w-full": style === "floating",
      })}
    >
      {style === "normal" && (
        <div className="absolute top-0 left-0 h-16 w-full -translate-y-16 bg-gradient-to-b from-transparent to-default-50" />
      )}

      <Card
        className={cn("h-full", {
          "rounded-t-none shadow-none border-t border-default-200":
            style === "floating",
        })}
      >
        <CardBody>
          <TextareaAutosize
            ref={textareaRef}
            placeholder="Ask anything..."
            className="outline-none resize-none bg-transparent"
            value={text}
            minRows={2}
            maxRows={10}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex justify-between items-center">
            <div />

            <div className="flex items-center justify-end gap-2 flex-1 w-full">
              <Dropdown isOpen={isOpen} onOpenChange={onOpenChange}>
                <DropdownTrigger>
                  <Button
                    variant="flat"
                    size="sm"
                    radius="full"
                    endContent={
                      <LucideChevronUp
                        className={cn(
                          "size-4 animate duration-200",
                          isOpen && "rotate-180",
                        )}
                      />
                    }
                  >
                    {model}
                  </Button>
                </DropdownTrigger>

                <DropdownMenu
                  aria-label="Models"
                  items={MODELS}
                  onAction={(key) => {
                    onModelChange(key as string);
                    onOpenChange();
                  }}
                >
                  {(model) => (
                    <DropdownItem
                      variant="flat"
                      key={model.key}
                      textValue={model.key}
                      title={model.key}
                      value={model.key}
                      endContent={
                        model.thinking && <LucideLightbulb className="size-4" />
                      }
                    />
                  )}
                </DropdownMenu>
              </Dropdown>

              <Button
                color="primary"
                isLoading={sending}
                onPress={() => {
                  send(text);
                  setText("");
                }}
                isIconOnly
                radius="full"
                size="sm"
              >
                <LucideArrowUp className="size-5" />
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
