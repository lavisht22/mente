import Chat from "@/components/chat";
import { chatsQuery } from "@/lib/queries";
import { Button, Skeleton } from "@heroui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LucideArrowLeft } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/_app/chats/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const { data: chats } = useSuspenseQuery(chatsQuery);

  const currentChat = useMemo(() => {
    return chats.find((chat) => chat.id === id);
  }, [chats, id]);

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
          {currentChat?.name ? (
            <p>{currentChat?.name}</p>
          ) : (
            <Skeleton className="w-32 h-6 rounded-lg" />
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Chat chatId={id} setChatId={() => {}} />
      </div>
    </div>
  );
}
