import Chat from "@/components/chat";
import { chatQuery } from "@/lib/queries";
import { Button, Skeleton } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LucideArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_app/chats/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const { data: chat } = useQuery(chatQuery(id));

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
          {chat?.name ? (
            <p className="line-clamp-1">{chat?.name}</p>
          ) : (
            <Skeleton className="w-32 h-6 rounded-lg" />
          )}
        </div>
      </div>

      <Chat chatId={id} />
    </div>
  );
}
