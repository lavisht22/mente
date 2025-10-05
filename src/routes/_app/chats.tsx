import Chat from "@/components/chat";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/chats")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="p-16">
      <Chat chatId="b284477c-544e-43d5-bbca-b2abebe08cf7" />
    </div>
  );
}
