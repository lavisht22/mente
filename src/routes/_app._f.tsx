import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import FloatingChat from "@/components/floating-chat";
import { cn } from "@heroui/react";

export const Route = createFileRoute("/_app/_f")({
  component: RouteComponent,
});

function RouteComponent() {
  const [isChatOpen, setIsChatOpen] = useState(true);

  return (
    <div className={cn(isChatOpen && "pr-[28rem]")}>
      <motion.div
        className=""
        layout
        transition={{
          duration: 0.5,
          type: "spring",
        }}
      >
        <Outlet />
      </motion.div>

      <AnimatePresence>
        <FloatingChat
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onOpen={() => setIsChatOpen(true)}
        />
      </AnimatePresence>
    </div>
  );
}
