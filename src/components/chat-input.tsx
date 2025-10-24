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

import {
  LucideArrowUp,
  LucideComponent,
  LucideLightbulb,
  LucidePaperclip,
  LucideX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const [isFocused, setIsFocused] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const { isOpen, onOpenChange } = useDisclosure();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect PWA fullscreen mode
  useEffect(() => {
    const checkPWA = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone ===
          true;
      setIsPWA(isStandalone);
    };

    checkPWA();
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    mediaQuery.addEventListener("change", checkPWA);

    return () => mediaQuery.removeEventListener("change", checkPWA);
  }, []);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      className={cn({
        "fixed bottom-0 w-full left-0 right-0 mx-auto max-w-2xl md:px-4 md:pb-6 bg-default-50":
          style === "normal",
        "w-full sticky bottom-0": style === "floating",
      })}
    >
      <Card
        className={cn("h-full", {
          "rounded-b-none": style === "floating",

          "rounded-b-none md:rounded-b-large": style === "normal",
        })}
      >
        <CardBody
          className={cn("gap-2 p-0 pb-2 md:pb-2", {
            "pb-6 md:pb-4": isPWA && !isFocused,
          })}
        >
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 pt-4">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="relative rounded-medium border-2 border-default-200"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-16 h-16 object-cover rounded-medium"
                  />
                  <Button
                    isIconOnly
                    size="sm"
                    radius="full"
                    variant="solid"
                    className="absolute -top-1.5 -right-1.5 min-w-5 w-5 h-5"
                    onPress={() => removeFile(index)}
                  >
                    <LucideX className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <TextareaAutosize
            ref={textareaRef}
            placeholder="Ask anything..."
            className="outline-none resize-none bg-transparent text-base px-4 pt-4"
            value={text}
            minRows={2}
            maxRows={10}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          <div className="flex justify-between items-center px-2">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                variant="light"
                radius="full"
                isIconOnly
                onPress={() => fileInputRef.current?.click()}
              >
                <LucidePaperclip className="size-4" />
              </Button>
              <Dropdown isOpen={isOpen} onOpenChange={onOpenChange}>
                <DropdownTrigger>
                  <Button
                    variant="light"
                    radius="full"
                    className="px-2 gap-2"
                    startContent={<LucideComponent className="size-4" />}
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
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                isDisabled={!text.trim() || sending}
                variant="flat"
                isLoading={sending}
                onPress={() => {
                  send(text);
                  setText("");
                }}
                isIconOnly
                radius="full"
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
