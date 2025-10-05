import Chat from "@/components/chat";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/chats")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="p-16">
      <Chat />
    </div>
  );
}
