import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import FloatingChat from "@/components/floating-chat";
import Logo from "@/components/logo";
import { spaceQuery } from "@/lib/queries";
import { Button, Card, Spinner, cn } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_app/spaces/$spaceId")({
  component: RouteComponent,
});

const CHAT_OPEN_KEY = "mente-chat-open";

function RouteComponent() {
  const { spaceId } = Route.useParams();
  const navigate = useNavigate();
  const { data: space, isError } = useQuery(spaceQuery(spaceId));

  const [isChatOpen, setIsChatOpen] = useState(() => {
    const stored = localStorage.getItem(CHAT_OPEN_KEY);
    return stored !== null ? stored === "true" : true;
  });

  useEffect(() => {
    localStorage.setItem(CHAT_OPEN_KEY, String(isChatOpen));
  }, [isChatOpen]);

  if (isError) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <p>Unable to load this space at the moment.</p>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <Spinner variant="wave" />
      </div>
    );
  }

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
            spaceId={spaceId}
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
            onPress={() => {
              navigate({
                to: "/chats",
                search: {
                  spaceId,
                },
              });
            }}
          >
            <Logo size={6} />
          </Button>
        </Card>
      </div>
    </div>
  );
}
