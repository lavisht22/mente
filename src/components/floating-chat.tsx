import { spaceChatsQuery } from "@/lib/queries";
import {
  Button,
  Card,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import {
  LucideHistory,
  LucideMaximize2,
  LucidePlus,
  LucideX,
} from "lucide-react";
import { useMemo, useState } from "react";
import Chat from "./chat";
import ChatNew from "./chat-new";
import Logo from "./logo";

interface FloatingChatProps {
  spaceId: string;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export default function FloatingChat({
  spaceId,
  isOpen,
  onOpen,
  onClose,
}: FloatingChatProps) {
  const navigate = useNavigate();
  const { data: chats } = useQuery(spaceChatsQuery(spaceId));

  const [currentChatId, setCurrentChatId] = useState<string | undefined>(
    undefined,
  );

  const currentChat = useMemo(() => {
    return chats?.find((chat) => chat.id === currentChatId);
  }, [chats, currentChatId]);

  if (!isOpen) {
    return (
      <Card className="fixed bottom-6 right-6 z-50 p-1 rounded-full">
        <Button
          radius="full"
          variant="light"
          isIconOnly
          size="lg"
          onPress={onOpen}
        >
          <Logo size={6} />
        </Button>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 100,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        y: 100,
      }}
      transition={{
        duration: 0.5,
        type: "spring",
      }}
      className="h-screen p-4 pl-0 fixed top-0 right-0 z-20 w-[28rem] shrink-0"
    >
      <Card className="h-full overflow-hidden">
        <div className="p-2 flex justify-between items-center border-b border-default-200">
          <div className="pl-2">
            <p className="text-sm line-clamp-1">{currentChat?.name}</p>
          </div>
          <div className="flex items-center">
            {currentChatId !== undefined && (
              <Button
                size="sm"
                isIconOnly
                variant="light"
                onPress={() => setCurrentChatId(undefined)}
              >
                <LucidePlus className="size-5" strokeWidth={1.7} />
              </Button>
            )}
            <Dropdown backdrop="blur" placement="bottom-end">
              <DropdownTrigger>
                <Button isIconOnly variant="light" size="sm">
                  <LucideHistory className="size-4" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Chat History"
                emptyContent="No recent chats"
                items={chats}
                onAction={(key) => setCurrentChatId(key as string)}
              >
                {(chat) => (
                  <DropdownItem
                    variant="flat"
                    key={chat.id}
                    textValue={chat.name || "Untitled Chat"}
                    title={chat.name || "Untitled Chat"}
                    description={formatDistanceToNow(
                      new Date(chat.created_at),
                      { addSuffix: true },
                    )}
                    value={chat.id}
                  />
                )}
              </DropdownMenu>
            </Dropdown>
            <div className="w-[1px] h-4 mx-1 bg-default-300 " />

            <Button
              size="sm"
              isIconOnly
              variant="light"
              onPress={() => {
                if (currentChatId) {
                  navigate({
                    to: `/chats/${currentChatId}`,
                  });
                } else {
                  navigate({
                    to: "/chats",
                    search: { spaceId },
                  });
                }
              }}
            >
              <LucideMaximize2 className="size-4" />
            </Button>

            <Button size="sm" isIconOnly variant="light" onPress={onClose}>
              <LucideX className="size-4" />
            </Button>
          </div>
        </div>
        <div className="h-full overflow-y-auto w-full overflow-x-hidden">
          {currentChatId ? (
            <Chat spaceId={spaceId} style="floating" chatId={currentChatId} />
          ) : (
            <ChatNew
              spaceId={spaceId}
              style="floating"
              setChatId={setCurrentChatId}
            />
          )}
        </div>
      </Card>
    </motion.div>
  );
}
