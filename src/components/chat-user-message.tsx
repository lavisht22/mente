import { signedURLQuery } from "@/lib/queries";
import supabase from "@/lib/supabase";
import {
  Button,
  Card,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Spinner,
  Textarea,
  cn,
} from "@heroui/react";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import type { FilePart, ImagePart } from "ai";
import type { Json } from "db.types";
import {
  ChevronDown,
  LucideCopy,
  LucideFileText,
  LucidePencil,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MessageT } from "./chat-message";

interface MessageProps {
  message: MessageT;
  loading: boolean;
}

function MessageEditor({
  chatId,
  messageId,
  text,
  setEditing,
  createdAt,
  attachments,
}: {
  chatId: string;
  text: string;
  messageId: string;
  setEditing: (editing: boolean) => void;
  createdAt: string;
  attachments: (ImagePart | FilePart)[];
}) {
  const queryClient = useQueryClient();
  const [internalText, setInternalText] = useState(text);

  const updateMessageMutation = useMutation({
    mutationFn: async (updatedText: string) => {
      const data = {
        role: "user",
        content: [...attachments, { type: "text", text: updatedText }],
      };

      await supabase
        .from("messages")
        .update({
          data: data as unknown as Json,
        })
        .eq("id", messageId)
        .throwOnError();

      await supabase
        .from("messages")
        .delete()
        .gt("created_at", createdAt)
        .eq("chat_id", chatId)
        .throwOnError();
    },
    onSuccess: () => {
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["chat_messages", chatId] });
    },
  });

  return (
    <div className="flex flex-col w-full gap-4">
      <Textarea
        variant="bordered"
        value={internalText}
        onValueChange={setInternalText}
      />
      <div className="flex justify-end gap-2">
        <Button variant="light">Cancel</Button>
        <Button
          color="primary"
          onPress={() => updateMessageMutation.mutate(internalText)}
          isLoading={updateMessageMutation.isPending}
        >
          Save
        </Button>
      </div>
    </div>
  );
}

function MessagePreview({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  // Check if the text is actually clamped (overflow)
  useEffect(() => {
    const element = textRef.current;
    if (element) {
      // Check if the scrollHeight is greater than clientHeight (meaning content is clamped)
      setIsClamped(element.scrollHeight > element.clientHeight);
    }
  }, []);

  return (
    <div className="bg-default-200/60 cursor-pointer py-2 px-3 rounded-2xl rounded-tr-none flex max-w-[calc(min(100dvw,_32rem)_-_3rem)]">
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
  );
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

export default function UserMessage({ message }: MessageProps) {
  const [editing, setEditing] = useState(false);

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

      {editing ? (
        <MessageEditor
          chatId={message.chat_id}
          messageId={message.id}
          text={text || ""}
          setEditing={setEditing}
          createdAt={message.created_at}
          attachments={attachments}
        />
      ) : (
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <div>
              <MessagePreview text={text || ""} />
            </div>
          </DropdownTrigger>
          <DropdownMenu>
            <DropdownItem
              startContent={<LucideCopy className="size-4" />}
              key="copy"
              onPress={() => {
                navigator.clipboard.writeText(text || "");
              }}
            >
              Copy
            </DropdownItem>
            <DropdownItem
              key="edit"
              startContent={<LucidePencil className="size-4" />}
              onPress={() => setEditing(true)}
            >
              Edit
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      )}
    </div>
  );
}
