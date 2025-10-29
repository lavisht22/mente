import Item from "@/components/item";
import NewDropdown from "@/components/new-dropdown";
import SpaceMembersDialog from "@/components/space-members-dialog";
import { spaceItemsQuery, spaceQuery } from "@/lib/queries";
import { Button } from "@heroui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { Tables } from "db.types";
import { LucideArrowLeft, LucidePlus } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/_app/_f/spaces/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const { data: space } = useSuspenseQuery(spaceQuery(id));
  const { data: items } = useSuspenseQuery(spaceItemsQuery(id));

  // Group items by date
  const groupedItems = useMemo(() => {
    const groups: Record<string, Tables<"items">[]> = {};

    for (const item of items) {
      const date = new Date(item.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
    }

    return groups;
  }, [items]);

  // Get sorted date keys (already in descending order from query)
  const dateKeys = Object.keys(groupedItems);

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
          <SpaceMembersDialog space_id={id} />
          <NewDropdown
            spaceId={id}
            trigger={
              <Button variant="light" size="lg" isIconOnly>
                <LucidePlus className="size-4" />
              </Button>
            }
          />
        </div>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        <h1 className="text-3xl mb-8">{space.name}</h1>

        {dateKeys.length === 0 ? (
          <div className="text-center text-default-400 py-12">
            No items in this space yet
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {dateKeys.map((date) => (
              <div key={date} className="flex flex-col gap-4">
                <p className="text-default-700">{date}</p>
                <div className="flex gap-4 flex-wrap">
                  {groupedItems[date].map((item) => (
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
