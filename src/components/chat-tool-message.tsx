import { AVAILABLE_TOOLS } from "@/lib/tools";
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  useDisclosure,
} from "@heroui/react";
import type { ModelMessage, ToolModelMessage, ToolResultPart } from "ai";
import type { Tables } from "db.types";
import { LucideCheck } from "lucide-react";
import { useMemo } from "react";

function ToolResultPartDrawer({ part }: { part: ToolResultPart }) {
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
        color={
          (part?.output?.type?.startsWith("error") && "danger") || "default"
        }
        startContent={<LucideCheck className="size-4" />}
        onPress={onOpenChange}
      >
        {tool.name} completed
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
            {(part.output.type === "text" ||
              part.output.type === "error-text") && (
              <pre className="whitespace-pre-wrap">{part.output.value}</pre>
            )}

            {(part.output.type === "json" ||
              part.output.type === "error-json") && (
              <pre className="whitespace-pre-wrap">
                <code>{JSON.stringify(part.output.value, null, 2)}</code>
              </pre>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}

interface MessageProps {
  message: Tables<"messages"> & { data: ModelMessage };
}

export default function ToolMessage({ message }: MessageProps) {
  const data = message.data as ToolModelMessage;

  return (
    <div>
      {data.content.map((part) => (
        <ToolResultPartDrawer key={part.toolCallId} part={part} />
      ))}
    </div>
  );
}
