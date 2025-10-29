import Item from "@/components/item";
import Nav from "@/components/nav";
import Space from "@/components/space";
import { itemsQuery, spacesQuery } from "@/lib/queries";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback } from "react";

export const Route = createFileRoute("/_app/")({
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
    <div className="w-full flex flex-col">
      <div className="flex items-center gap-4 p-6">
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl lg:text-4xl">{getGreeting()}!</h1>
        </div>
        <div />
      </div>

      <div className="">
        <h3 className="text-lg font-medium ml-6">Recent Items</h3>
        <div className="flex gap-4 w-full overflow-x-auto p-6 -mt-2 scrollbar-hide">
          {items?.map((item) => (
            <Item key={item.id} {...item} />
          ))}
        </div>
      </div>

      <div className="">
        <h3 className="text-lg font-medium ml-6">Recent Spaces</h3>
        <div className="flex gap-4 w-full overflow-x-auto p-6 -mt-2 scrollbar-hide">
          {spaces?.map((space) => (
            <Space key={space.id} {...space} />
          ))}
        </div>
      </div>
      <Nav />
    </div>
  );
}
