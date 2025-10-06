import { Button, Card } from "@heroui/react";
import { useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { LucideMessageSquareShare, LucideMinimize2 } from "lucide-react";
import Chat from "./chat";

interface FloatingChatProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export default function FloatingChat({
  isOpen,
  onOpen,
  onClose,
}: FloatingChatProps) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  // Don't show floating chat on chat routes
  if (currentPath.startsWith("/chats")) {
    return null;
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-30">
        <Button radius="full" isIconOnly size="lg" onPress={onOpen}>
          <LucideMessageSquareShare className="size-5" />
        </Button>
      </div>
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
      className="h-full p-4 pl-0 sticky top-0 z-20 w-full max-w-md 2xl:max-w-lg"
    >
      <Card className="h-full overflow-hidden">
        <div className="p-2 flex justify-between items-center border-b border-default-200">
          <div />
          <Button isIconOnly variant="light" onPress={onClose}>
            <LucideMinimize2 className="size-5" />
          </Button>
        </div>
        <div className="h-full overflow-y-auto w-full overflow-x-hidden">
          <Chat style="floating" />
        </div>
      </Card>
    </motion.div>
  );
}
