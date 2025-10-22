import ChatNew from "@/components/chat-new";
import { chatsQuery } from "@/lib/queries";

import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { LucideArrowLeft, LucideHistory } from "lucide-react";

export const Route = createFileRoute("/_app/chats/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { data: chats } = useSuspenseQuery(chatsQuery);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div
        id="header"
        className="p-2 flex justify-between items-center gap-4 sticky top-0 z-10 bg-default-50"
      >
        <div className="flex items-center gap-0.5">
          <Button
            size="lg"
            isIconOnly
            variant="light"
            onPress={() => history.go(-1)}
          >
            <LucideArrowLeft className="size-4" />
          </Button>
        </div>

        <div>
          <Dropdown>
            <DropdownTrigger>
              <Button size="lg" isIconOnly variant="light">
                <LucideHistory className="size-4" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Chat History"
              emptyContent="No recent chats"
              items={chats}
              onAction={(key) => {
                navigate({ to: `/chats/${key}` });
              }}
            >
              {(chat) => (
                <DropdownItem
                  variant="flat"
                  key={chat.id}
                  textValue={chat.name || "Untitled Chat"}
                  title={chat.name || "Untitled Chat"}
                  description={formatDistanceToNow(new Date(chat.created_at), {
                    addSuffix: true,
                  })}
                  value={chat.id}
                />
              )}
            </DropdownMenu>
          </Dropdown>
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
