import Item from "@/components/item";
import NewDropdown from "@/components/new-dropdown";
import Space from "@/components/space";
import { itemsQuery, spacesQuery } from "@/lib/queries";
import { Button } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LucidePlus } from "lucide-react";
import { useCallback } from "react";

export const Route = createFileRoute("/_app/_f/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: items } = useQuery(itemsQuery);
  const { data: spaces } = useQuery(spacesQuery);

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
    <div className="w-full">
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
        <div className="flex gap-4 w-full overflow-x-auto p-8 -mt-8 scrollbar-hide">
          {items?.map((item) => (
            <Item key={item.id} {...item} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium ml-8">Recent Spaces</h3>
        <div className="flex gap-4 w-full overflow-x-auto p-8 -mt-8 scrollbar-hide">
          {spaces?.map((space) => (
            <Space key={space.id} {...space} />
          ))}
        </div>
      </div>
    </div>
  );
}
