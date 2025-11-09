import Item from "@/components/item";
import Space from "@/components/space";
import { itemsQuery, spacesQuery, userQuery } from "@/lib/queries";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback } from "react";

export const Route = createFileRoute("/_app/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: items } = useQuery(itemsQuery);
  const { data: spaces } = useQuery(spacesQuery);
  const { data: user } = useQuery(userQuery);

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
    <div className="flex flex-col h-full py-6">
      <h1 className="text-3xl ml-6 mb-8">
        <span>{getGreeting()}</span>
        <span className="font-serif italic">{`${user && `, ${user.name}`}`}</span>
        !
      </h1>

      <div>
        <h3 className="text-lg font-medium ml-6">Recent Items</h3>
        <div className="flex gap-4 w-full overflow-x-auto p-6 -mt-2 scrollbar-hide">
          {items?.map((item) => (
            <Item key={item.id} {...item} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium ml-6">Recent Spaces</h3>
        <div className="flex gap-4 w-full overflow-x-auto p-6 -mt-2 scrollbar-hide">
          {spaces?.map((space) => (
            <Space key={space.id} {...space} />
          ))}
        </div>
      </div>
    </div>
  );
}
