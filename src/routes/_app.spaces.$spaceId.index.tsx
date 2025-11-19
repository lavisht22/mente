import Item from "@/components/item";
import NewDropdown from "@/components/new-dropdown";
import SpaceMembers from "@/components/space-members";
import { spaceItemsQuery, spaceQuery } from "@/lib/queries";
import { Button } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { Tables } from "db.types";
import { LucideArrowLeft, LucidePlus } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/_app/spaces/$spaceId/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { spaceId } = Route.useParams();
  const { data: space } = useQuery(spaceQuery(spaceId));
  const { data: items } = useQuery(spaceItemsQuery(spaceId));

  // Group items by month
  const groupedItems = useMemo(() => {
    if (!items) return {};

    const groups: Record<string, Tables<"items">[]> = {};

    for (const item of items) {
      const date = new Date(item.created_at);
      const monthKey = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });

      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(item);
    }

    // Sort items within each month by date (latest first)
    for (const monthKey in groups) {
      groups[monthKey].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }

    return groups;
  }, [items]);

  // Get sorted month keys (most recent first)
  const monthKeys = Object.keys(groupedItems).sort((a, b) => {
    const dateA = new Date(`${a} 1`);
    const dateB = new Date(`${b} 1`);
    return dateB.getTime() - dateA.getTime();
  });

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
        <div className="flex items-center">
          <SpaceMembers space_id={spaceId} />
          <NewDropdown
            spaceId={spaceId}
            trigger={
              <Button variant="light" size="lg" isIconOnly>
                <LucidePlus className="size-4" />
              </Button>
            }
          />
        </div>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        <h1 className="text-3xl font-medium mb-8">{space?.name}</h1>

        {monthKeys.length === 0 ? (
          <div className="text-center text-default-400 py-12">
            No items in this space yet
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {monthKeys.map((month) => (
              <div key={month} className="flex flex-col gap-4">
                <p className="text-default-700">{month}</p>
                <div className="flex gap-4 flex-wrap">
                  {groupedItems[month].map((item) => (
                    <Item key={item.id} {...item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
