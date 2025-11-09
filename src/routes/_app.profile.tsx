import { Button } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { LucideArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_app/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="h-16 px-2 flex justify-between items-center gap-4">
        <div>
          <Button
            isIconOnly
            variant="light"
            size="lg"
            onPress={() => history.go(-1)}
          >
            <LucideArrowLeft className="size-4" />
          </Button>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-auto max-w-3xl mx-auto w-full">
        <h1 className="text-3xl mb-8">Profile</h1>

        <div className="flex flex-col gap-8">Profile page coming soon...</div>
      </div>
    </div>
  );
}
