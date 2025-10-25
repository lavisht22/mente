import {
  Button,
  Card,
  CardBody,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  addToast,
  cn,
  useDisclosure,
} from "@heroui/react";

import {
  LucideArrowUp,
  LucideComponent,
  LucideFileText,
  LucideLightbulb,
  LucidePaperclip,
  LucideSettings2,
  LucideX,
} from "lucide-react";
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

function Preview({ attachment }: { attachment: File }) {
  const isImage = attachment.type.startsWith("image/");

  if (isImage) {
    return (
      <img
        src={URL.createObjectURL(attachment)}
        alt={attachment.name}
        className="w-16 h-16 object-cover rounded-medium"
      />
    );
  }

  return (
    <div className="w-full max-w-36 h-16 space-y-2 rounded-large p-2">
      <p className="text-sm line-clamp-1 font-medium">{attachment.name}</p>
      <div className="flex gap-1 items-center">
        <LucideFileText className="size-4" />
        <p className="text-xs">
          {attachment.type.split("/").pop()?.toUpperCase()}
        </p>
      </div>
    </div>
  );
}

interface ChatInputProps {
  style?: "floating" | "normal";
  send: (payload: {
    text: string;
    attachments: File[];
    clear: () => void;
  }) => void;
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
  const [attachments, setAttachments] = useState<File[]>([]);
  const { isOpen, onOpenChange } = useDisclosure();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clear = useCallback(() => {
    setText("");
    setAttachments([]);
  }, []);

  const handleSend = useCallback(() => {
    if (!text.trim() || sending) return;

    send({ text, attachments, clear });
  }, [text, attachments, sending, send, clear]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();

        handleSend();
      }
    },
    [handleSend],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const maxDocumentSize = 7 * 1024 * 1024; // 7MB in bytes for documents
    const maxImages = 50;
    const maxDocuments = 10;

    // Categorize existing attachments
    const existingImages = attachments.filter((file) =>
      file.type.startsWith("image/"),
    );
    const existingDocuments = attachments.filter(
      (file) => !file.type.startsWith("image/"),
    );

    // Filter and validate files
    const validFiles: File[] = [];

    for (const file of selectedFiles) {
      const isImage = file.type.startsWith("image/");
      const isDocument =
        file.type === "application/pdf" || file.type === "text/plain";

      if (!isImage && !isDocument) {
        continue;
      }

      // Check document size limit (7MB for PDFs and text files)
      if (isDocument && file.size > maxDocumentSize) {
        addToast({
          title: "File too large",
          description: `${file.name} exceeds the 7MB limit for documents.`,
          color: "danger",
        });
        continue;
      }

      validFiles.push(file);
    }

    // Categorize new valid files
    const newImages = validFiles.filter((file) =>
      file.type.startsWith("image/"),
    );
    const newDocuments = validFiles.filter(
      (file) => !file.type.startsWith("image/"),
    );

    // Check image count limit
    if (existingImages.length + newImages.length > maxImages) {
      addToast({
        title: "Too many images",
        description: `You can only attach up to ${maxImages} images at a time.`,
        color: "danger",
      });
      return;
    }

    // Check document count limit
    if (existingDocuments.length + newDocuments.length > maxDocuments) {
      addToast({
        title: "Too many documents",
        description: `You can only attach up to ${maxDocuments} documents (PDFs and text files) at a time.`,
        color: "danger",
      });
      return;
    }

    setAttachments((prev) => [...prev, ...validFiles]);
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      className={cn({
        "w-full mx-auto max-w-2xl md:px-4 md:pb-6 bg-default-50":
          style === "normal",
        "w-full bottom-0": style === "floating",
      })}
    >
      <Card
        className={cn("h-full", {
          "rounded-b-none": style === "floating",
          "rounded-b-none md:rounded-b-large": style === "normal",
        })}
      >
        <CardBody
          className={cn("gap-2 p-0 pb-2 md")}
          style={{
            paddingBottom: isFocused
              ? "8px"
              : "max(env(safe-area-inset-bottom), 8px)",
          }}
        >
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 pt-4">
              {attachments.map((attachment, index) => (
                <Card
                  key={`${attachment.name}-${index}`}
                  className="relative overflow-visible"
                >
                  <Preview attachment={attachment} />
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
                </Card>
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
            <div className="flex items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf,text/plain"
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

              <Button
                variant="light"
                radius="full"
                isIconOnly
                isDisabled
                // onPress={() => fileInputRef.current?.click()}
              >
                <LucideSettings2 className="size-4" />
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
                onPress={handleSend}
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
