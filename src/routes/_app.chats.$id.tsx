import Chat from "@/components/chat";
import { Button } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { LucideArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_app/chats/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div
        id="header"
        className="p-4 flex justify-between items-center gap-4 sticky top-0 z-10 bg-default-50"
      >
        <div>
          <Button isIconOnly variant="light" onPress={() => history.go(-1)}>
            <LucideArrowLeft className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Chat chatId={id} setChatId={() => {}} />
      </div>
    </div>
  );
}
