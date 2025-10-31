import ChatNew from "@/components/chat-new";
import { spaceChatsQuery } from "@/lib/queries";

import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { LucideArrowLeft, LucideHistory } from "lucide-react";

type ChatSearch = {
  spaceId?: string;
};

export const Route = createFileRoute("/_app/chats/")({
  component: RouteComponent,
  validateSearch: (search): ChatSearch => ({
    spaceId: search.spaceId as string | undefined,
  }),
});

function RouteComponent() {
  const { spaceId } = Route.useSearch();
  const navigate = useNavigate();
  const { data: chats } = useQuery(spaceChatsQuery(spaceId));

  if (!spaceId) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <p className="max-w-lg text-center">
          Looks like you have accidently landed on this page. If you want to
          start a new chat, you can go to a space and start one.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-1 flex justify-between items-center gap-4">
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
          {chats && (
            <Dropdown backdrop="blur" placement="bottom-end">
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
                    description={formatDistanceToNow(
                      new Date(chat.created_at),
                      {
                        addSuffix: true,
                      },
                    )}
                    value={chat.id}
                  />
                )}
              </DropdownMenu>
            </Dropdown>
          )}
        </div>
      </div>

      <ChatNew
        spaceId={spaceId}
        setChatId={(id: string) => {
          navigate({
            to: `/chats/${id}`,
            replace: true,
          });
        }}
      />
    </div>
  );
}
