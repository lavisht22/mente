import ChatNew from "@/components/chat-new";

import { Button } from "@heroui/react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LucideArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_app/chats/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div
        id="header"
        className="p-4 flex justify-between items-center gap-4 sticky top-0 z-10 bg-default-50"
      >
        <div className="flex items-center gap-2">
          <Button isIconOnly variant="light" onPress={() => history.go(-1)}>
            <LucideArrowLeft className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ChatNew
          setChatId={(id: string) => {
            navigate({
              to: `/chats/${id}`,
              replace: true,
            });
          }}
        />
      </div>
    </div>
  );
}
