import Chat from "@/components/chat";
import { chatQuery } from "@/lib/queries";
import { Button, Skeleton, Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LucideArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_app/chats/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const { data: chat, isError } = useQuery(chatQuery(id));

  if (isError) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <p>Unable to load this chat at the moment.</p>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <Spinner variant="wave" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="h-16 px-2 flex justify-between items-center gap-4">
        <div className="flex items-center gap-0.5">
          <Button
            size="lg"
            isIconOnly
            variant="light"
            onPress={() => history.go(-1)}
          >
            <LucideArrowLeft className="size-4" />
          </Button>
          {chat?.name ? (
            <p className="line-clamp-1">{chat?.name}</p>
          ) : (
            <Skeleton className="w-32 h-6 rounded-lg" />
          )}
        </div>
      </div>

      <Chat spaceId={chat.space_id} chatId={id} />
    </div>
  );
}
