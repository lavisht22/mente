import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import FloatingChat from "@/components/floating-chat";
import Logo from "@/components/logo";
import { Button, Card, cn } from "@heroui/react";

export const Route = createFileRoute("/_app/_f")({
  component: RouteComponent,
});

const CHAT_OPEN_KEY = "mente-chat-open";

function RouteComponent() {
  const [isChatOpen, setIsChatOpen] = useState(() => {
    const stored = localStorage.getItem(CHAT_OPEN_KEY);
    return stored !== null ? stored === "true" : true;
  });

  useEffect(() => {
    localStorage.setItem(CHAT_OPEN_KEY, String(isChatOpen));
  }, [isChatOpen]);

  return (
    <div className={cn("h-full", isChatOpen && "md:pr-[28rem]")}>
      <motion.div
        className="h-full"
        layout
        transition={{
          duration: 0.5,
          type: "spring",
        }}
      >
        <Outlet />
      </motion.div>

      <div className="hidden md:block">
        <AnimatePresence>
          <FloatingChat
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            onOpen={() => setIsChatOpen(true)}
          />
        </AnimatePresence>
      </div>
      <div className="md:hidden">
        <Card className="fixed bottom-6 right-6 z-50 p-1 rounded-full">
          <Button
            radius="full"
            variant="light"
            isIconOnly
            size="lg"
            as={Link}
            to="/chats"
          >
            <Logo size={6} />
          </Button>
        </Card>
      </div>
    </div>
  );
}
