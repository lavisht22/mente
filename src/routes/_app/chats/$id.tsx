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
    <div>
      <div
        id="header"
        className="p-4 flex justify-between items-center gap-4 sticky top-0 z-10 bg-background"
      >
        <div>
          <Button isIconOnly variant="light" onPress={() => history.go(-1)}>
            <LucideArrowLeft className="size-4" />
          </Button>
        </div>
      </div>
      <div className="p-8 max-w-4xl mx-auto">
        <Chat chatId={id} />
      </div>
    </div>
  );
}
