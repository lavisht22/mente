import NewDropdown from "@/components/new-dropdown";
import { Button } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { LucidePlus } from "lucide-react";
import { useCallback } from "react";
import RecentItems from "./-components/recent-items";
import RecentSpaces from "./-components/recent-spaces";

export const Route = createFileRoute("/_app/")({
  component: RouteComponent,
});

function RouteComponent() {
  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return "Good morning";
    }
    if (hour < 18) {
      return "Good afternoon";
    }
    return "Good evening";
  }, []);

  return (
    <div>
      <div className="flex items-center gap-4 p-8">
        <div className="flex-1">
          <h1 className="text-4xl">{getGreeting()}</h1>
        </div>
        <div>
          <NewDropdown
            trigger={
              <Button isIconOnly color="primary" variant="flat">
                <LucidePlus className="size-5" />
              </Button>
            }
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium ml-8">Recent Items</h3>
        <RecentItems />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium ml-8">Recent Spaces</h3>
        <RecentSpaces />
      </div>
    </div>
  );
}
