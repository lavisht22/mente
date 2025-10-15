import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { LucideMessageSquareShare } from "lucide-react";
import { useState } from "react";

import FloatingChat from "@/components/floating-chat";
import { Button, Card, cn } from "@heroui/react";

export const Route = createFileRoute("/_app/_f")({
  component: RouteComponent,
});

function RouteComponent() {
  const [isChatOpen, setIsChatOpen] = useState(true);

  return (
    <div className={cn(isChatOpen && "md:pr-[28rem]")}>
      <motion.div
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
            <LucideMessageSquareShare className="size-5" />
          </Button>
        </Card>
      </div>
    </div>
  );
}
