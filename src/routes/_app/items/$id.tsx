import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Select,
  SelectItem,
} from "@heroui/react";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { spacesQuery } from "@/lib/queries";
import supabase from "@/lib/supabase";
import {
  LucideArrowLeft,
  LucideEllipsisVertical,
  LucideTrash,
} from "lucide-react";
import NoteEditor from "./-components/note-editor";

export const Route = createFileRoute("/_app/items/$id")({
  component: RouteComponent,
});

const itemQuery = (id: string) =>
  queryOptions({
    queryKey: ["item", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      return data;
    },
  });

function RouteComponent() {
  const { id } = Route.useParams();

  const { history } = useRouter();
  const { data: item } = useQuery(itemQuery(id));
  const { data: spaces } = useQuery(spacesQuery);

  const [spaceId, setSpaceId] = useState<string | null>(item?.space_id ?? null);

  useEffect(() => {
    if (item) {
      setSpaceId(item.space_id ?? null);
    }
  }, [item]);

  return (
    <div>
      <div id="header" className="p-4 flex justify-between items-center gap-4">
        <div>
          <Button isIconOnly variant="light" onPress={() => history.go(-1)}>
            <LucideArrowLeft className="size-4" />
          </Button>
        </div>

        <div className="flex-1 flex justify-end items-center gap-2">
          <Select
            variant="bordered"
            color="primary"
            className="w-full max-w-40"
            placeholder="Space"
            selectedKeys={spaceId ? [spaceId] : []}
            onSelectionChange={(keys) =>
              setSpaceId(Array.from(keys)[0] as string)
            }
          >
            {(spaces ?? []).map((space) => (
              <SelectItem key={space.id}>{space.name}</SelectItem>
            ))}
          </Select>
          <Dropdown backdrop="blur">
            <DropdownTrigger>
              <Button variant="light" isIconOnly>
                <LucideEllipsisVertical className="size-4" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem
                key="delete"
                startContent={<LucideTrash className="size-4" />}
                color="danger"
              >
                Delete
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
      <div className="p-8">
        {item?.type === "note" && <NoteEditor item={item} />}
      </div>
    </div>
  );
}
